import base64
import json
import urllib.request
import numpy as np
import cv2

import os

GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8000")

def create_sample_face(color_seed=120):
    """Generates a synthetic 200x200 portrait image with face-like structures."""
    img = np.ones((200, 200, 3), dtype=np.uint8) * 230
    # Head contour
    cv2.ellipse(img, (100, 100), (60, 80), 0, 0, 360, (180, 150, color_seed), -1)
    # Eyes
    cv2.circle(img, (80, 80), 10, (50, 50, 50), -1)
    cv2.circle(img, (120, 80), 10, (50, 50, 50), -1)
    # Pupils
    cv2.circle(img, (80, 80), 4, (20, 20, 20), -1)
    cv2.circle(img, (120, 80), 4, (20, 20, 20), -1)
    # Nose
    cv2.line(img, (100, 85), (100, 110), (70, 70, 70), 3)
    # Mouth
    cv2.ellipse(img, (100, 135), (25, 10), 0, 0, 180, (40, 40, 150), 3)
    
    # Encode as JPEG base64
    _, buf = cv2.imencode('.jpg', img)
    return "data:image/jpeg;base64," + base64.b64encode(buf).decode('utf-8')

def test_flow():
    print("--- 1. Login tradicional con Admin para obtener JWT ---")
    req = urllib.request.Request(
        f"{GATEWAY_URL}/api/auth/login",
        data=json.dumps({"username": "admin", "password": "Admin123!"}).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        auth_data = json.loads(resp.read().decode('utf-8'))
        token = auth_data["token"]
        print(f"[OK] Admin logueado. Token JWT obtenido (longitud: {len(token)})")

    print("\n--- 2. Enrolar rostro biométrico para Admin (ID: 1) ---")
    face_img_admin = create_sample_face(color_seed=150)
    req = urllib.request.Request(
        f"{GATEWAY_URL}/api/users/1/biometrics",
        data=json.dumps({"image": face_img_admin}).encode('utf-8'),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
    )
    try:
        with urllib.request.urlopen(req) as resp:
            enroll_data = json.loads(resp.read().decode('utf-8'))
            print(f"[OK] Enrolamiento exitoso: {enroll_data.get('message')}")
    except urllib.error.HTTPError as he:
        print(f"Error HTTP {he.code}: {he.read().decode('utf-8')}")
        return

    print("\n--- 3. Verificar estado biométrico desde API ---")
    req = urllib.request.Request(
        f"{GATEWAY_URL}/api/users/biometrics-status",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req) as resp:
        status_data = json.loads(resp.read().decode('utf-8'))
        print(f"[OK] Usuarios enrolados: {status_data}")

    print("\n--- 4. Probar Login Facial Biométrico con el rostro de Admin ---")
    req = urllib.request.Request(
        f"{GATEWAY_URL}/api/auth/facial-login",
        data=json.dumps({"image": face_img_admin}).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        login_res = json.loads(resp.read().decode('utf-8'))
        print(f"[EXITO TOTAL] Login Facial completado!")
        print(f"   Usuario: {login_res['user']['nombre_completo']} ({login_res['user']['rol']})")
        print(f"   Confianza biométrica: {login_res.get('confidence')}%")
        print(f"   Token JWT emitido: {login_res['token'][:30]}...")

    print("\n--- 5. Probar Rechazo con un rostro desconocido ---")
    stranger_face = np.ones((200, 200, 3), dtype=np.uint8) * 30
    cv2.circle(stranger_face, (100, 100), 70, (200, 50, 50), -1)
    _, buf2 = cv2.imencode('.jpg', stranger_face)
    stranger_b64 = "data:image/jpeg;base64," + base64.b64encode(buf2).decode('utf-8')
    
    try:
        req = urllib.request.Request(
            f"{GATEWAY_URL}/api/auth/facial-login",
            data=json.dumps({"image": stranger_b64}).encode('utf-8'),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            print("ERROR: No debió autenticar rostro desconocido")
    except urllib.error.HTTPError as he:
        err_body = json.loads(he.read().decode('utf-8'))
        print(f"[CORRECTO] Acceso denegado a rostro desconocido (Status {he.code}): {err_body.get('error')}")

if __name__ == "__main__":
    test_flow()

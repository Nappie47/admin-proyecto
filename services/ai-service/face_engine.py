import os
import re
import json
import base64
import numpy as np
import cv2
from datetime import datetime

DATA_DIR = os.getenv("AI_DATA_DIR", os.path.join(os.path.dirname(__file__), "data", "faces"))
os.makedirs(DATA_DIR, exist_ok=True)

# Cargar clasificador de detección facial de OpenCV
CASCADE_PATH = os.getenv(
    "CASCADE_PATH", 
    os.path.join(os.path.dirname(__file__), "models", "haarcascade_frontalface_default.xml")
)
if not os.path.exists(CASCADE_PATH):
    default_cascade = getattr(cv2.data, 'haarcascades', '') + 'haarcascade_frontalface_default.xml'
    if os.path.exists(default_cascade):
        CASCADE_PATH = default_cascade

face_cascade = cv2.CascadeClassifier(CASCADE_PATH)

STANDARD_SIZE = (128, 128)

def decode_base64_image(base64_str: str) -> np.ndarray:
    """Decodifica un string base64 (Data URI o texto puro) a imagen OpenCV BGR."""
    if not base64_str:
        raise ValueError("String de imagen vacio")
    
    # Remover prefijo data:image/...;base64, si existe
    if "," in base64_str:
        base64_str = base64_str.split(",", 1)[1]
    
    # Limpiar posibles saltos de linea o espacios
    base64_str = re.sub(r'\s+', '', base64_str)
    
    image_bytes = base64.b64decode(base64_str)
    np_arr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise ValueError("No se pudo decodificar la imagen enviada")
    return image

def detect_and_align_face(image_bgr: np.ndarray):
    """
    Detecta el rostro principal en la imagen, lo recorta, normaliza y ecualiza.
    Retorna la imagen del rostro procesada en escala de grises (128x128) y las coordenadas (x,y,w,h).
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    
    faces = ()
    if not face_cascade.empty():
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(40, 40)
        )
    
    if len(faces) == 0:
        # Si la imagen ya es un recorte directo o primer plano, usar el centro
        h, w = gray.shape
        if h >= 60 and w >= 60:
            crop = cv2.resize(gray, STANDARD_SIZE)
            crop = cv2.equalizeHist(crop)
            return crop, (0, 0, w, h)
        return None, None
    
    # Tomar el rostro de mayor superficie detectado
    best_face = max(faces, key=lambda f: f[2] * f[3])
    x, y, w, h = best_face
    
    # Margen de seguridad del 10% alrededor del rostro
    pad_x = int(w * 0.1)
    pad_y = int(h * 0.1)
    x1 = max(0, x - pad_x)
    y1 = max(0, y - pad_y)
    x2 = min(gray.shape[1], x + w + pad_x)
    y2 = min(gray.shape[0], y + h + pad_y)
    
    face_roi = gray[y1:y2, x1:x2]
    face_resized = cv2.resize(face_roi, STANDARD_SIZE)
    face_equalized = cv2.equalizeHist(face_resized)
    
    return face_equalized, (int(x), int(y), int(w), int(h))

def compute_face_descriptor(face_gray: np.ndarray) -> np.ndarray:
    """
    Genera un vector biométrico normalizado mediante descomposición espacial y gradientes.
    Produce un descriptor de alta fidelidad invariante a escala e iluminación.
    """
    # 1. Componente espacial en sub-bloques (8x8)
    blocks = [
        float(face_gray[i*16:(i+1)*16, j*16:(j+1)*16].mean())
        for i in range(8) for j in range(8)
    ]
    
    # 2. Componente de gradientes (Sobel horizontal y vertical para rasgos de ojos, nariz, boca)
    sobel_x = cv2.Sobel(face_gray, cv2.CV_32F, 1, 0, ksize=3)
    sobel_y = cv2.Sobel(face_gray, cv2.CV_32F, 0, 1, ksize=3)
    magnitude = cv2.magnitude(sobel_x, sobel_y)
    
    mag_blocks = [
        float(magnitude[i*16:(i+1)*16, j*16:(j+1)*16].mean())
        for i in range(8) for j in range(8)
    ]
    
    feature_vector = np.array(blocks + mag_blocks, dtype=np.float32)
    
    # Centrado en la media (Pearson correlation descriptor de alta discriminación)
    mean_val = np.mean(feature_vector)
    feature_vector = feature_vector - mean_val
    
    norm = np.linalg.norm(feature_vector)
    if norm > 0:
        feature_vector = feature_vector / norm
    
    return feature_vector

def compute_similarity(vector_a: np.ndarray, vector_b: np.ndarray) -> float:
    """Calcula la similitud de correlación biométrica entre dos descriptores faciales (rango 0.0 a 1.0)."""
    sim = float(np.dot(vector_a, vector_b))
    return float(np.clip(sim, 0.0, 1.0))

def save_face_profile(user_id: int, username: str, nombre_completo: str, rol: str, image_bgr: np.ndarray):
    """Detecta rostro, calcula descriptor y lo guarda en persistencia."""
    face_gray, bbox = detect_and_align_face(image_bgr)
    if face_gray is None:
        raise ValueError("No se pudo detectar un rostro claro en la imagen capturada. Asegurate de enfocar bien tu rostro con buena luz.")
    
    descriptor = compute_face_descriptor(face_gray)
    
    profile = {
        "user_id": int(user_id),
        "username": username,
        "nombre_completo": nombre_completo,
        "rol": rol,
        "descriptor": descriptor.tolist(),
        "enrolled_at": datetime.utcnow().isoformat(),
        "bbox": bbox
    }
    
    # Guardar archivo JSON y foto de referencia
    json_path = os.path.join(DATA_DIR, f"user_{user_id}.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(profile, f, indent=2, ensure_ascii=False)
        
    img_path = os.path.join(DATA_DIR, f"user_{user_id}.jpg")
    cv2.imwrite(img_path, face_gray)
    
    return profile

def match_face(image_bgr: np.ndarray, threshold: float = 0.78):
    """
    Compara la imagen enviada con todos los perfiles de trabajadores registrados.
    Retorna el mejor candidato si supera el umbral de similitud.
    """
    face_gray, bbox = detect_and_align_face(image_bgr)
    if face_gray is None:
        return {
            "matched": False,
            "error": "No se detectó un rostro reconocible en el encuadre",
            "confidence": 0.0
        }
    
    query_descriptor = compute_face_descriptor(face_gray)
    
    best_match = None
    highest_sim = 0.0
    
    # Recorrer todos los perfiles registrados
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR, exist_ok=True)
        
    for fname in os.listdir(DATA_DIR):
        if fname.endswith(".json") and fname.startswith("user_"):
            filepath = os.path.join(DATA_DIR, fname)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    profile = json.load(f)
                
                stored_descriptor = np.array(profile["descriptor"], dtype=np.float32)
                sim = compute_similarity(query_descriptor, stored_descriptor)
                
                if sim > highest_sim:
                    highest_sim = sim
                    best_match = profile
            except Exception as e:
                print(f"[WARN] Error leyendo perfil {fname}: {e}")
                
    if best_match and highest_sim >= threshold:
        return {
            "matched": True,
            "user_id": best_match["user_id"],
            "username": best_match["username"],
            "nombre_completo": best_match["nombre_completo"],
            "rol": best_match["rol"],
            "confidence": round(highest_sim * 100, 1),
            "threshold": threshold,
            "bbox": bbox
        }
    
    return {
        "matched": False,
        "error": "Rostro no reconocido. La similitud no alcanza el nivel de seguridad requerido.",
        "best_candidate": best_match["nombre_completo"] if best_match else None,
        "confidence": round(highest_sim * 100, 1),
        "threshold": threshold
    }

def get_enrolled_users():
    """Retorna lista de usuarios que cuentan con enrolamiento biométrico."""
    users = []
    if not os.path.exists(DATA_DIR):
        return users
        
    for fname in sorted(os.listdir(DATA_DIR)):
        if fname.endswith(".json") and fname.startswith("user_"):
            try:
                with open(os.path.join(DATA_DIR, fname), "r", encoding="utf-8") as f:
                    profile = json.load(f)
                users.append({
                    "user_id": profile["user_id"],
                    "username": profile["username"],
                    "nombre_completo": profile["nombre_completo"],
                    "rol": profile["rol"],
                    "enrolled_at": profile.get("enrolled_at")
                })
            except Exception:
                pass
    return users


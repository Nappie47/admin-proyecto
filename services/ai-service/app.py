import os
import time
import logging
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from face_engine import (
    decode_base64_image,
    save_face_profile,
    match_face,
    get_enrolled_users,
    DATA_DIR
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ai_service")

app = Flask(__name__)
CORS(app)

# Métricas simples en memoria para Prometheus
METRICS = {
    "requests_total": 0,
    "recognitions_total": 0,
    "recognitions_success": 0,
    "recognitions_failed": 0,
    "registrations_total": 0,
    "start_time": time.time()
}

@app.before_request
def before_request():
    METRICS["requests_total"] += 1

@app.route("/health", methods=["GET"])
@app.route("/api/ai/health", methods=["GET"])
def health():
    """Health check para orquestador Docker y balanceador HAProxy."""
    enrolled = get_enrolled_users()
    return jsonify({
        "status": "healthy",
        "service": "ai-biometrics-service",
        "version": "1.0.0",
        "engine": "OpenCV Haar-Cascade + High-Fidelity Spatial Biometrics",
        "enrolled_users_count": len(enrolled),
        "data_directory": DATA_DIR
    }), 200

@app.route("/metrics", methods=["GET"])
@app.route("/api/ai/metrics", methods=["GET"])
def metrics():
    """Exportador de métricas en formato texto de Prometheus."""
    enrolled_count = len(get_enrolled_users())
    uptime = time.time() - METRICS["start_time"]
    
    lines = [
        "# HELP ai_service_up Indica si el microservicio de IA está activo",
        "# TYPE ai_service_up gauge",
        "ai_service_up 1",
        "",
        "# HELP ai_service_uptime_seconds Tiempo en segundos desde el inicio del microservicio",
        "# TYPE ai_service_uptime_seconds counter",
        f"ai_service_uptime_seconds {uptime:.1f}",
        "",
        "# HELP ai_enrolled_users_count Total de usuarios con perfil biométrico facial registrado",
        "# TYPE ai_enrolled_users_count gauge",
        f"ai_enrolled_users_count {enrolled_count}",
        "",
        "# HELP ai_requests_total Total de peticiones HTTP procesadas por el microservicio",
        "# TYPE ai_requests_total counter",
        f"ai_requests_total {METRICS['requests_total']}",
        "",
        "# HELP ai_facial_recognitions_total Total de intentos de reconocimiento facial",
        "# TYPE ai_facial_recognitions_total counter",
        f"ai_facial_recognitions_total {METRICS['recognitions_total']}",
        "",
        "# HELP ai_facial_recognitions_success Total de reconocimientos faciales exitosos",
        "# TYPE ai_facial_recognitions_success counter",
        f"ai_facial_recognitions_success {METRICS['recognitions_success']}",
        "",
        "# HELP ai_facial_recognitions_failed Total de reconocimientos faciales fallidos",
        "# TYPE ai_facial_recognitions_failed counter",
        f"ai_facial_recognitions_failed {METRICS['recognitions_failed']}",
        "",
        "# HELP ai_facial_registrations_total Total de enrolamientos faciales realizados",
        "# TYPE ai_facial_registrations_total counter",
        f"ai_facial_registrations_total {METRICS['registrations_total']}"
    ]
    return Response("\n".join(lines) + "\n", mimetype="text/plain; version=0.0.4; charset=utf-8")

@app.route("/api/ai/recognize", methods=["POST"])
def recognize():
    """
    RF-IA-01: Reconocimiento Facial para Login Biométrico.
    Recibe imagen en Base64, la procesa y determina si coincide con un funcionario/admin.
    """
    METRICS["recognitions_total"] += 1
    data = request.get_json() or {}
    image_str = data.get("image")
    threshold = float(data.get("threshold", 0.75))

    if not image_str:
        return jsonify({
            "matched": False,
            "error": "Debe proporcionar una imagen para el reconocimiento facial"
        }), 400

    try:
        image_bgr = decode_base64_image(image_str)
        result = match_face(image_bgr, threshold=threshold)

        if result.get("matched"):
            METRICS["recognitions_success"] += 1
            logger.info(f"Reconocimiento facial exitoso para {result.get('username')} (Confianza: {result.get('confidence')}%)")
            return jsonify({
                "success": True,
                **result
            }), 200
        else:
            METRICS["recognitions_failed"] += 1
            logger.warning(f"Reconocimiento facial no exitoso: {result.get('error')}")
            return jsonify({
                "success": False,
                **result
            }), 401

    except ValueError as ve:
        METRICS["recognitions_failed"] += 1
        return jsonify({"success": False, "matched": False, "error": str(ve)}), 400
    except Exception as e:
        logger.error(f"Error procesando reconocimiento facial: {e}", exc_info=True)
        return jsonify({"success": False, "matched": False, "error": f"Error interno del motor de IA: {str(e)}"}), 500

@app.route("/api/ai/register", methods=["POST"])
def register():
    """
    RF-IA-02: Enrolamiento Biométrico Facial.
    Permite asociar una captura de rostro a un usuario existente.
    """
    METRICS["registrations_total"] += 1
    data = request.get_json() or {}
    user_id = data.get("user_id")
    username = data.get("username")
    nombre_completo = data.get("nombre_completo", username)
    rol = data.get("rol", "funcionario")
    image_str = data.get("image")

    if not user_id or not username or not image_str:
        return jsonify({
            "success": False,
            "error": "Parámetros incompletos (user_id, username e image son obligatorios)"
        }), 400

    try:
        image_bgr = decode_base64_image(image_str)
        profile = save_face_profile(
            user_id=int(user_id),
            username=str(username),
            nombre_completo=str(nombre_completo),
            rol=str(rol),
            image_bgr=image_bgr
        )
        logger.info(f"Enrolamiento biométrico completado para usuario {username} (ID: {user_id})")
        return jsonify({
            "success": True,
            "message": f"Perfil biométrico registrado exitosamente para {username}",
            "profile": {
                "user_id": profile["user_id"],
                "username": profile["username"],
                "nombre_completo": profile["nombre_completo"],
                "rol": profile["rol"],
                "enrolled_at": profile["enrolled_at"]
            }
        }), 201

    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        logger.error(f"Error en registro facial: {e}", exc_info=True)
        return jsonify({"success": False, "error": f"Error interno al guardar perfil biométrico: {str(e)}"}), 500

@app.route("/api/ai/users", methods=["GET"])
def enrolled_users():
    """Lista todos los funcionarios y administradores enrolados biométricamente."""
    users = get_enrolled_users()
    return jsonify({
        "success": True,
        "count": len(users),
        "users": users
    }), 200

@app.route("/api/ai/users/<int:user_id>", methods=["DELETE"])
def delete_user_biometrics(user_id):
    """Elimina el perfil biométrico de un usuario."""
    json_path = os.path.join(DATA_DIR, f"user_{user_id}.json")
    img_path = os.path.join(DATA_DIR, f"user_{user_id}.jpg")
    deleted = False

    if os.path.exists(json_path):
        os.remove(json_path)
        deleted = True
    if os.path.exists(img_path):
        os.remove(img_path)
        deleted = True

    if deleted:
        return jsonify({"success": True, "message": f"Biometría de usuario {user_id} eliminada"}), 200
    return jsonify({"success": False, "error": "Perfil biométrico no encontrado"}), 404

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)


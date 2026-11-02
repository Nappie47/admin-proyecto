import os
import json
import urllib.request
import urllib.error
from functools import wraps
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity, get_jwt
)
from extensions import db
from models.user import User

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://ai_service:5001")

def query_ai_service(path, payload=None, method="POST"):
    """Helper para invocar el microservicio interno de IA de forma sincrónica."""
    url = f"{AI_SERVICE_URL}{path}"
    data = json.dumps(payload).encode('utf-8') if payload is not None else None
    headers = {"Content-Type": "application/json"} if payload is not None else {}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode('utf-8')
            return json.loads(body), resp.status
    except urllib.error.HTTPError as he:
        body = he.read().decode('utf-8')
        try:
            return json.loads(body), he.code
        except Exception:
            return {"success": False, "error": str(he)}, he.code
    except Exception as e:
        return {"success": False, "error": f"Error conectando con el microservicio de IA: {str(e)}"}, 503

def role_required(*allowed_roles):
    """Decorator to enforce role-based access control (RF02)"""
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get('rol', '')
            if user_role not in allowed_roles:
                return jsonify({
                    'success': False,
                    'error': f'Acceso denegado. Se requiere uno de los siguientes roles: {", ".join(allowed_roles)}'
                }), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

@auth_bp.route('/login', methods=['POST'])
def login():
    """RF01: Autenticación tradicional mediante usuario/correo y contraseña."""
    data = request.get_json() or {}
    identifier = data.get('username') or data.get('email')
    password = data.get('password')

    if not identifier or not password:
        return jsonify({'success': False, 'error': 'Debe ingresar usuario/correo y contraseña'}), 400

    identifier = identifier.strip()
    user = User.query.filter(
        (User.username.ilike(identifier)) | (User.email.ilike(identifier))
    ).first()

    if not user or not user.check_password(password):
        return jsonify({'success': False, 'error': 'Credenciales inválidas'}), 401

    if not user.activo:
        return jsonify({'success': False, 'error': 'Usuario deshabilitado. Contacte al administrador.'}), 403

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            'username': user.username,
            'email': user.email,
            'nombre_completo': user.nombre_completo,
            'rol': user.rol
        }
    )

    return jsonify({
        'success': True,
        'token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/facial-login', methods=['POST'])
def facial_login():
    """
    RF-IA-01: Autenticación Biométrica Facial con IA.
    Envía la captura facial al microservicio de IA para reconocimiento y emite token JWT.
    """
    data = request.get_json() or {}
    image_str = data.get('image')

    if not image_str:
        return jsonify({'success': False, 'error': 'Debe capturar o enviar una fotografía del rostro'}), 400

    # Consultar al microservicio de IA
    ai_resp, status_code = query_ai_service('/api/ai/recognize', payload={
        'image': image_str,
        'threshold': 0.72
    }, method='POST')

    if status_code != 200 or not ai_resp.get('matched'):
        error_msg = ai_resp.get('error', 'Rostro no reconocido o coincidencia insuficiente.')
        return jsonify({
            'success': False,
            'error': error_msg,
            'confidence': ai_resp.get('confidence', 0.0),
            'matched': False
        }), 401

    user_id = ai_resp.get('user_id')
    user = User.query.get(int(user_id)) if user_id else None

    # Fallback por username si ID difiere
    if not user and ai_resp.get('username'):
        user = User.query.filter_by(username=ai_resp.get('username')).first()

    if not user:
        return jsonify({
            'success': False,
            'error': f'El rostro coincide con {ai_resp.get("username")}, pero el usuario no existe en la base de datos principal.'
        }), 404

    if not user.activo:
        return jsonify({
            'success': False,
            'error': 'Usuario deshabilitado. Contacte al administrador municipal.'
        }), 403

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            'username': user.username,
            'email': user.email,
            'nombre_completo': user.nombre_completo,
            'rol': user.rol
        }
    )

    return jsonify({
        'success': True,
        'token': access_token,
        'user': user.to_dict(),
        'confidence': ai_resp.get('confidence'),
        'method': 'facial_recognition_ai'
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    """Obtiene el usuario actual autenticado"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'success': False, 'error': 'Usuario no encontrado'}), 404
    return jsonify({'success': True, 'user': user.to_dict()}), 200

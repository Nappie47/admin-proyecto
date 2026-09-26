from functools import wraps
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity, get_jwt
)
from extensions import db
from models.user import User

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

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
    """RF01: Autenticación de administradores y funcionarios mediante correo o username"""
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

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    """Obtiene el usuario actual autenticado"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'success': False, 'error': 'Usuario no encontrado'}), 404
    return jsonify({'success': True, 'user': user.to_dict()}), 200

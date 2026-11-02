from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from extensions import db
from models.user import User
from routes.auth_routes import role_required, query_ai_service

user_bp = Blueprint('users', __name__, url_prefix='/api/users')

@user_bp.route('', methods=['GET'])
@role_required('administrador')
def list_users():
    """RF03: El administrador puede consultar y administrar usuarios internos"""
    users = User.query.order_by(User.id.asc()).all()
    
    # Obtener estado biométrico de IA
    ai_resp, status = query_ai_service('/api/ai/users', method='GET')
    enrolled_ids = set()
    if status == 200 and ai_resp.get('success'):
        enrolled_ids = {u['user_id'] for u in ai_resp.get('users', [])}

    result = []
    for u in users:
        d = u.to_dict()
        d['has_biometrics'] = u.id in enrolled_ids
        result.append(d)

    return jsonify({
        'success': True,
        'users': result
    }), 200

@user_bp.route('', methods=['POST'])
@role_required('administrador')
def create_user():
    """RF03: Registrar un nuevo usuario interno con rol (admin o funcionario)"""
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    nombre_completo = data.get('nombre_completo', '').strip()
    rol = data.get('rol', 'funcionario').lower().strip()

    if not username or not email or not password or not nombre_completo:
        return jsonify({'success': False, 'error': 'Faltan campos requeridos'}), 400

    if rol not in ['administrador', 'funcionario']:
        return jsonify({'success': False, 'error': 'Rol inválido. Debe ser administrador o funcionario'}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({'success': False, 'error': 'El nombre de usuario o email ya existe'}), 409

    new_user = User(
        username=username,
        email=email,
        nombre_completo=nombre_completo,
        rol=rol,
        activo=data.get('activo', True)
    )
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    # Si se incluye imagen para enrolamiento biométrico inmediato
    image_str = data.get('biometric_image')
    biometric_status = None
    if image_str:
        ai_resp, code = query_ai_service('/api/ai/register', payload={
            'user_id': new_user.id,
            'username': new_user.username,
            'nombre_completo': new_user.nombre_completo,
            'rol': new_user.rol,
            'image': image_str
        }, method='POST')
        biometric_status = ai_resp

    user_dict = new_user.to_dict()
    user_dict['has_biometrics'] = bool(image_str and biometric_status and biometric_status.get('success'))

    return jsonify({
        'success': True,
        'message': 'Usuario creado exitosamente',
        'user': user_dict,
        'biometric_status': biometric_status
    }), 201

@user_bp.route('/<int:user_id>', methods=['PUT'])
@role_required('administrador')
def update_user(user_id):
    """RF03: Modificar usuario interno"""
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}

    if 'nombre_completo' in data:
        user.nombre_completo = data['nombre_completo'].strip()
    if 'email' in data:
        user.email = data['email'].strip()
    if 'rol' in data:
        rol = data['rol'].lower().strip()
        if rol in ['administrador', 'funcionario']:
            user.rol = rol
    if 'activo' in data:
        user.activo = bool(data['activo'])
    if 'password' in data and data['password']:
        user.set_password(data['password'])

    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Usuario actualizado exitosamente',
        'user': user.to_dict()
    }), 200

@user_bp.route('/<int:user_id>', methods=['DELETE'])
@role_required('administrador')
def deactivate_user(user_id):
    """RF03: Desactivar usuario interno"""
    user = User.query.get_or_404(user_id)
    user.activo = False
    db.session.commit()
    return jsonify({
        'success': True,
        'message': f'Usuario {user.username} desactivado correctamente'
    }), 200

# ==============================================================================
# ENPOINTS DE ENROLAMIENTO Y GESTIÓN BIOMÉTRICA (IA)
# ==============================================================================

@user_bp.route('/<int:user_id>/biometrics', methods=['POST'])
@jwt_required()
def register_biometrics(user_id):
    """
    RF-IA-02: Enrolar o actualizar la biometría facial de un usuario.
    Permitido para administradores o para el propio usuario autenticado.
    """
    claims = get_jwt()
    current_user_id = int(get_jwt_identity())
    current_role = claims.get('rol', '')

    if current_role != 'administrador' and current_user_id != user_id:
        return jsonify({'success': False, 'error': 'No tiene permisos para modificar la biometría de otro usuario'}), 403

    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}
    image_str = data.get('image')

    if not image_str:
        return jsonify({'success': False, 'error': 'Debe capturar o proporcionar una imagen facial'}), 400

    ai_resp, status = query_ai_service('/api/ai/register', payload={
        'user_id': user.id,
        'username': user.username,
        'nombre_completo': user.nombre_completo,
        'rol': user.rol,
        'image': image_str
    }, method='POST')

    if status != 201 or not ai_resp.get('success'):
        return jsonify({
            'success': False,
            'error': ai_resp.get('error', 'No se pudo procesar el rostro para biometría')
        }), 400

    return jsonify({
        'success': True,
        'message': f'Perfil biométrico registrado correctamente para {user.nombre_completo}',
        'profile': ai_resp.get('profile')
    }), 200

@user_bp.route('/<int:user_id>/biometrics', methods=['DELETE'])
@jwt_required()
def delete_biometrics(user_id):
    """Elimina el registro biométrico de un usuario."""
    claims = get_jwt()
    current_user_id = int(get_jwt_identity())
    current_role = claims.get('rol', '')

    if current_role != 'administrador' and current_user_id != user_id:
        return jsonify({'success': False, 'error': 'No tiene permisos para eliminar la biometría de este usuario'}), 403

    ai_resp, status = query_ai_service(f'/api/ai/users/{user_id}', method='DELETE')
    return jsonify(ai_resp), status

@user_bp.route('/biometrics-status', methods=['GET'])
@jwt_required()
def biometrics_status():
    """Lista los usuarios que tienen enrolamiento facial activo."""
    ai_resp, status = query_ai_service('/api/ai/users', method='GET')
    return jsonify(ai_resp), status

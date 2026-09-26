from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models.user import User
from routes.auth_routes import role_required

user_bp = Blueprint('users', __name__, url_prefix='/api/users')

@user_bp.route('', methods=['GET'])
@role_required('administrador')
def list_users():
    """RF03: El administrador puede consultar y administrar usuarios internos"""
    users = User.query.order_by(User.id.asc()).all()
    return jsonify({
        'success': True,
        'users': [u.to_dict() for u in users]
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

    return jsonify({
        'success': True,
        'message': 'Usuario creado exitosamente',
        'user': new_user.to_dict()
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
    """RF03: Desactivar o eliminar usuario interno"""
    user = User.query.get_or_404(user_id)
    # Prevent self-deletion
    user.activo = False
    db.session.commit()
    return jsonify({
        'success': True,
        'message': f'Usuario {user.username} desactivado correctamente'
    }), 200

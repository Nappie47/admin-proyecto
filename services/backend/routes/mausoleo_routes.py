from flask import Blueprint, request, jsonify
from extensions import db
from models.mausoleo import MausoleoHistorico
from routes.auth_routes import role_required

mausoleo_bp = Blueprint('mausoleos', __name__, url_prefix='/api/mausoleos')

@mausoleo_bp.route('', methods=['GET'])
def list_mausoleos():
    """RF12: Catastro Histórico para los 40 mausoleos emblemáticos"""
    destacados_only = request.args.get('destacado', '').lower() == 'true'
    
    query = MausoleoHistorico.query
    if destacados_only:
        query = query.filter_by(destacado=True)
        
    mausoleos = query.order_by(MausoleoHistorico.ano_construccion.asc()).all()
    
    return jsonify({
        'success': True,
        'total': len(mausoleos),
        'mausoleos': [m.to_dict() for m in mausoleos]
    }), 200

@mausoleo_bp.route('/<int:mausoleo_id>', methods=['GET'])
def get_mausoleo(mausoleo_id):
    """RF12: Detalle histórico, reseñas y fotografías de un mausoleo"""
    mausoleo = MausoleoHistorico.query.get_or_404(mausoleo_id)
    return jsonify({
        'success': True,
        'mausoleo': mausoleo.to_dict()
    }), 200

@mausoleo_bp.route('', methods=['POST'])
@role_required('administrador')
def create_mausoleo():
    """RF12: Registrar nuevo mausoleo en el catastro histórico"""
    data = request.get_json() or {}
    nombre = data.get('nombre', '').strip()
    resena = data.get('resena_historica', '').strip()

    if not nombre or not resena:
        return jsonify({'success': False, 'error': 'Nombre y reseña son obligatorios'}), 400

    mausoleo = MausoleoHistorico(
        nombre=nombre,
        familia=data.get('familia', '').strip(),
        ano_construccion=data.get('ano_construccion'),
        arquitecto=data.get('arquitecto', '').strip(),
        estilo_arquitectonico=data.get('estilo_arquitectonico', '').strip(),
        resena_historica=resena,
        foto_url=data.get('foto_url', '').strip(),
        patio_id=data.get('patio_id'),
        latitud=float(data.get('latitud', -37.4680)),
        longitud=float(data.get('longitud', -72.3520)),
        destacado=bool(data.get('destacado', False))
    )

    db.session.add(mausoleo)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Mausoleo histórico registrado',
        'mausoleo': mausoleo.to_dict()
    }), 201

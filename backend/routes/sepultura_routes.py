from datetime import datetime
from flask import Blueprint, request, jsonify
from extensions import db
from models.sepultura import Sepultura
from models.patio import Patio
from models.mausoleo import MausoleoHistorico
from routes.auth_routes import role_required

sepultura_bp = Blueprint('sepulturas', __name__, url_prefix='/api/sepulturas')

@sepultura_bp.route('', methods=['GET'])
def list_sepulturas():
    """
    RF07 & RF08: Consulta y búsqueda de sepulturas con múltiples criterios.
    Accesible para público general y funcionarios.
    """
    q = request.args.get('q', '').strip()
    nombre = request.args.get('nombre', '').strip()
    apellido = request.args.get('apellido', '').strip()
    patio_num = request.args.get('patio', '').strip()
    sector = request.args.get('sector', '').strip()
    tipo = request.args.get('tipo', '').strip()
    estado = request.args.get('estado', '').strip()
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    include_deleted = request.args.get('include_deleted', 'false').lower() == 'true'

    query = Sepultura.query.join(Patio, Sepultura.patio_id == Patio.id)

    if not include_deleted:
        query = query.filter(Sepultura.is_deleted == False)

    # General quick search bar (q)
    if q:
        query = query.filter(
            (Sepultura.numero.ilike(f'%{q}%')) |
            (Sepultura.nombre_fallecido.ilike(f'%{q}%')) |
            (Sepultura.apellido_paterno.ilike(f'%{q}%')) |
            (Sepultura.apellido_materno.ilike(f'%{q}%'))
        )

    # Detailed filters (RF08)
    if nombre:
        query = query.filter(Sepultura.nombre_fallecido.ilike(f'%{nombre}%'))
    if apellido:
        query = query.filter(
            (Sepultura.apellido_paterno.ilike(f'%{apellido}%')) |
            (Sepultura.apellido_materno.ilike(f'%{apellido}%'))
        )
    if patio_num and patio_num.lower() != 'todos':
        query = query.filter(Patio.numero == int(patio_num))
    if sector and sector.lower() != 'todos':
        query = query.filter(Sepultura.sector == sector)
    if tipo and tipo.lower() != 'todos':
        query = query.filter(Sepultura.tipo == tipo)
    if estado and estado.lower() != 'todos':
        query = query.filter(Sepultura.estado == estado)

    total = query.count()
    paginated = query.order_by(Sepultura.patio_id.asc(), Sepultura.numero.asc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'success': True,
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': paginated.pages,
        'sepulturas': [s.to_dict() for s in paginated.items]
    }), 200

@sepultura_bp.route('/stats', methods=['GET'])
def get_stats():
    """Métricas y estadísticas para el Panel Administrativo (Mockup Slide 9)"""
    total = Sepultura.query.filter_by(is_deleted=False).count()
    disponibles = Sepultura.query.filter_by(is_deleted=False, estado='Disponible').count()
    ocupadas = Sepultura.query.filter_by(is_deleted=False, estado='Ocupada').count()
    en_mantenimiento = Sepultura.query.filter_by(is_deleted=False, estado='En Mantenimiento').count()
    mausoleos_count = MausoleoHistorico.query.count()

    pct_disponibles = round((disponibles / total * 100), 1) if total > 0 else 0
    pct_ocupadas = round((ocupadas / total * 100), 1) if total > 0 else 0

    return jsonify({
        'success': True,
        'total_sepulturas': total,
        'disponibles': disponibles,
        'ocupadas': ocupadas,
        'en_mantenimiento': en_mantenimiento,
        'pct_disponibles': pct_disponibles,
        'pct_ocupadas': pct_ocupadas,
        'mausoleos_historicos': mausoleos_count
    }), 200

@sepultura_bp.route('/geojson', methods=['GET'])
def get_sepulturas_geojson():
    """RF09 & RF10: Representación espacial en GeoJSON para el Visor Cartográfico"""
    patio_num = request.args.get('patio', type=int)
    estado = request.args.get('estado')

    query = Sepultura.query.filter_by(is_deleted=False)
    if patio_num:
        query = query.join(Patio).filter(Patio.numero == patio_num)
    if estado and estado.lower() != 'todos':
        query = query.filter(Sepultura.estado == estado)

    sepulturas = query.all()
    features = [s.to_geojson_feature() for s in sepulturas]

    return jsonify({
        'type': 'FeatureCollection',
        'features': features
    }), 200

@sepultura_bp.route('/<int:sepultura_id>', methods=['GET'])
def get_sepultura(sepultura_id):
    """RF07: Consulta de ficha detallada de una sepultura"""
    sepultura = Sepultura.query.get_or_404(sepultura_id)
    return jsonify({
        'success': True,
        'sepultura': sepultura.to_dict()
    }), 200

@sepultura_bp.route('', methods=['POST'])
@role_required('administrador', 'funcionario')
def create_sepultura():
    """RF04: Registro de nuevas sepulturas por usuarios autorizados"""
    data = request.get_json() or {}
    numero = data.get('numero', '').strip()
    patio_numero = data.get('patio_numero') or data.get('patio_id')
    sector = data.get('sector', 'A').strip().upper()
    tipo = data.get('tipo', 'Individual').strip()
    estado = data.get('estado', 'Disponible').strip()
    latitud = data.get('latitud')
    longitud = data.get('longitud')

    if not numero or not patio_numero:
        return jsonify({'success': False, 'error': 'Número y patio son obligatorios'}), 400

    # Locate patio
    patio = Patio.query.filter((Patio.numero == patio_numero) | (Patio.id == patio_numero)).first()
    if not patio:
        return jsonify({'success': False, 'error': f'El patio {patio_numero} no existe'}), 404

    # Check duplicates in same patio
    exists = Sepultura.query.filter_by(numero=numero, patio_id=patio.id, is_deleted=False).first()
    if exists:
        return jsonify({'success': False, 'error': f'La sepultura {numero} ya existe en el patio {patio.numero}'}), 409

    # Default coordinates inside cemetery if not provided
    if latitud is None or longitud is None:
        latitud = -37.46820
        longitud = -72.35210

    # Parse dates if provided
    fecha_nac = None
    fecha_fal = None
    if data.get('fecha_nacimiento'):
        try:
            fecha_nac = datetime.strptime(data['fecha_nacimiento'], '%Y-%m-%d').date()
        except ValueError:
            pass
    if data.get('fecha_fallecimiento'):
        try:
            fecha_fal = datetime.strptime(data['fecha_fallecimiento'], '%Y-%m-%d').date()
        except ValueError:
            pass

    sepultura = Sepultura(
        numero=numero,
        patio_id=patio.id,
        sector=sector,
        tipo=tipo,
        estado=estado,
        nombre_fallecido=data.get('nombre_fallecido', '').strip() or None,
        apellido_paterno=data.get('apellido_paterno', '').strip() or None,
        apellido_materno=data.get('apellido_materno', '').strip() or None,
        fecha_nacimiento=fecha_nac,
        fecha_fallecimiento=fecha_fal,
        observaciones=data.get('observaciones', '').strip() or None,
        ubicacion_detalle=data.get('ubicacion_detalle', '').strip() or f"Patio {patio.numero}, Sector {sector}, Número {numero}",
        latitud=float(latitud),
        longitud=float(longitud),
        geom_geojson=data.get('geom_geojson')
    )

    db.session.add(sepultura)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Sepultura registrada exitosamente',
        'sepultura': sepultura.to_dict()
    }), 201

@sepultura_bp.route('/<int:sepultura_id>', methods=['PUT'])
@role_required('administrador', 'funcionario')
def update_sepultura(sepultura_id):
    """RF05: Modificación y actualización de información de una sepultura"""
    sepultura = Sepultura.query.get_or_404(sepultura_id)
    data = request.get_json() or {}

    if 'numero' in data:
        sepultura.numero = str(data['numero']).strip()
    if 'patio_numero' in data or 'patio_id' in data:
        val = data.get('patio_numero') or data.get('patio_id')
        patio = Patio.query.filter((Patio.numero == val) | (Patio.id == val)).first()
        if patio:
            sepultura.patio_id = patio.id
    if 'sector' in data:
        sepultura.sector = str(data['sector']).strip().upper()
    if 'tipo' in data:
        sepultura.tipo = str(data['tipo']).strip()
    if 'estado' in data:
        sepultura.estado = str(data['estado']).strip()
    if 'nombre_fallecido' in data:
        sepultura.nombre_fallecido = data['nombre_fallecido'].strip() or None
    if 'apellido_paterno' in data:
        sepultura.apellido_paterno = data['apellido_paterno'].strip() or None
    if 'apellido_materno' in data:
        sepultura.apellido_materno = data['apellido_materno'].strip() or None
    if 'fecha_nacimiento' in data:
        if data['fecha_nacimiento']:
            try:
                sepultura.fecha_nacimiento = datetime.strptime(data['fecha_nacimiento'], '%Y-%m-%d').date()
            except ValueError:
                pass
        else:
            sepultura.fecha_nacimiento = None
    if 'fecha_fallecimiento' in data:
        if data['fecha_fallecimiento']:
            try:
                sepultura.fecha_fallecimiento = datetime.strptime(data['fecha_fallecimiento'], '%Y-%m-%d').date()
            except ValueError:
                pass
        else:
            sepultura.fecha_fallecimiento = None
    if 'observaciones' in data:
        sepultura.observaciones = data['observaciones']
    if 'ubicacion_detalle' in data:
        sepultura.ubicacion_detalle = data['ubicacion_detalle']
    if 'latitud' in data and data['latitud'] is not None:
        sepultura.latitud = float(data['latitud'])
    if 'longitud' in data and data['longitud'] is not None:
        sepultura.longitud = float(data['longitud'])
    if 'geom_geojson' in data:
        sepultura.geom_geojson = data['geom_geojson']

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Sepultura actualizada exitosamente',
        'sepultura': sepultura.to_dict()
    }), 200

@sepultura_bp.route('/<int:sepultura_id>', methods=['DELETE'])
@role_required('administrador', 'funcionario')
def delete_sepultura(sepultura_id):
    """RF06: Eliminación o desactivación lógica de registros"""
    sepultura = Sepultura.query.get_or_404(sepultura_id)
    permanent = request.args.get('permanent', 'false').lower() == 'true'

    if permanent:
        db.session.delete(sepultura)
    else:
        sepultura.is_deleted = True

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Sepultura {sepultura.numero} desactivada correctamente'
    }), 200

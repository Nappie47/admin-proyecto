from datetime import datetime
import json
import math
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from extensions import db
from models.sepultura import Sepultura
from models.patio import Patio
from models.mausoleo import MausoleoHistorico
from routes.auth_routes import role_required

sepultura_bp = Blueprint('sepulturas', __name__, url_prefix='/api/sepulturas')

def parse_coordinates(latitud, longitud):
    if isinstance(latitud, bool) or isinstance(longitud, bool):
        raise ValueError('La latitud y longitud deben ser números válidos.')
    try:
        latitud = float(latitud)
        longitud = float(longitud)
    except (TypeError, ValueError, OverflowError) as error:
        raise ValueError('La latitud y longitud deben ser números válidos.') from error

    if (
        not math.isfinite(latitud)
        or not math.isfinite(longitud)
        or not -90 <= latitud <= 90
        or not -180 <= longitud <= 180
    ):
        raise ValueError('La latitud o longitud está fuera del rango geográfico válido.')

    return latitud, longitud

def parse_optional_date(value, field_name):
    if value in (None, ''):
        return None
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except (TypeError, ValueError) as error:
        raise ValueError(f'{field_name} debe tener el formato AAAA-MM-DD y ser una fecha válida.') from error

def _point_in_ring(longitude, latitude, ring):
    inside = False
    for index in range(len(ring) - 1):
        first_lon, first_lat = ring[index][:2]
        second_lon, second_lat = ring[index + 1][:2]

        cross = (
            (longitude - first_lon) * (second_lat - first_lat)
            - (latitude - first_lat) * (second_lon - first_lon)
        )
        if (
            abs(cross) < 1e-10
            and min(first_lon, second_lon) - 1e-10 <= longitude <= max(first_lon, second_lon) + 1e-10
            and min(first_lat, second_lat) - 1e-10 <= latitude <= max(first_lat, second_lat) + 1e-10
        ):
            return True

        if (first_lat > latitude) != (second_lat > latitude):
            intersection_lon = (
                (second_lon - first_lon) * (latitude - first_lat)
                / (second_lat - first_lat)
                + first_lon
            )
            if longitude < intersection_lon:
                inside = not inside

    return inside

def is_location_within_patio(patio, latitude, longitude):
    try:
        geometry = json.loads(patio.geom_geojson) if patio.geom_geojson else None
    except (TypeError, ValueError) as error:
        raise ValueError('El patio seleccionado no tiene una geometría válida.') from error

    coordinates = geometry.get('coordinates') if isinstance(geometry, dict) and geometry.get('type') == 'Polygon' else None
    if not isinstance(coordinates, list) or not coordinates:
        raise ValueError('El patio seleccionado no tiene un polígono registrado.')

    for ring in coordinates:
        if (
            not isinstance(ring, list)
            or len(ring) < 4
            or any(not isinstance(point, list) or len(point) < 2 for point in ring)
        ):
            raise ValueError('El patio seleccionado no tiene una geometría válida.')
        if ring[0][:2] != ring[-1][:2]:
            raise ValueError('El patio seleccionado no tiene una geometría válida.')
        for point in ring:
            longitude_value, latitude_value = point[:2]
            if (
                isinstance(longitude_value, bool)
                or isinstance(latitude_value, bool)
                or not isinstance(longitude_value, (int, float))
                or not isinstance(latitude_value, (int, float))
                or not math.isfinite(longitude_value)
                or not math.isfinite(latitude_value)
            ):
                raise ValueError('El patio seleccionado no tiene una geometría válida.')

    if not _point_in_ring(longitude, latitude, coordinates[0]):
        return False
    return not any(
        _point_in_ring(longitude, latitude, hole)
        for hole in coordinates[1:]
    )

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

    if include_deleted:
        verify_jwt_in_request()
    else:
        verify_jwt_in_request(optional=True)

    user_role = get_jwt().get('rol')
    if include_deleted:
        if user_role not in ('administrador', 'funcionario'):
            return jsonify({
                'success': False,
                'error': 'Acceso denegado. Se requiere rol de administrador o funcionario.'
            }), 403
    include_observaciones = user_role in ('administrador', 'funcionario')

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
        'sepulturas': [
            s.to_dict(include_observaciones=include_observaciones)
            for s in paginated.items
        ]
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
    verify_jwt_in_request(optional=True)
    user_role = get_jwt().get('rol')
    is_staff = user_role in ('administrador', 'funcionario')
    if sepultura.is_deleted and not is_staff:
        return jsonify({
            'success': False,
            'error': 'Recurso no encontrado'
        }), 404

    return jsonify({
        'success': True,
        'sepultura': sepultura.to_dict(include_observaciones=is_staff)
    }), 200

@sepultura_bp.route('', methods=['POST'])
@role_required('administrador', 'funcionario')
def create_sepultura():
    """RF04: Registro de nuevas sepulturas por usuarios autorizados"""
    data = request.get_json() or {}
    numero = data.get('numero', '').strip()
    patio_numero = data.get('patio_numero')
    patio_id = data.get('patio_id')
    sector = data.get('sector', 'A').strip().upper()
    tipo = data.get('tipo', 'Individual').strip()
    estado = data.get('estado', 'Disponible').strip()
    latitud = data.get('latitud')
    longitud = data.get('longitud')

    if not numero or not patio_numero:
        return jsonify({'success': False, 'error': 'Número y patio son obligatorios'}), 400

    # Locate patio
    if patio_numero is not None:
        patio = Patio.query.filter_by(numero=patio_numero).first()
    elif patio_id is not None:
        patio = Patio.query.filter_by(id=patio_id).first()
    else:
        patio = None
    if not patio:
        selected_patio = patio_numero if patio_numero is not None else patio_id
        return jsonify({'success': False, 'error': f'El patio {selected_patio} no existe'}), 404

    # Check duplicates in same patio
    exists = Sepultura.query.filter_by(numero=numero, patio_id=patio.id, is_deleted=False).first()
    if exists:
        return jsonify({'success': False, 'error': f'La sepultura {numero} ya existe en el patio {patio.numero}'}), 409

    if latitud is None or longitud is None:
        return jsonify({'success': False, 'error': 'La latitud y longitud son obligatorias.'}), 400

    try:
        latitud, longitud = parse_coordinates(latitud, longitud)
        fecha_nac = parse_optional_date(data.get('fecha_nacimiento'), 'La fecha de nacimiento')
        fecha_fal = parse_optional_date(data.get('fecha_fallecimiento'), 'La fecha de fallecimiento')
    except ValueError as error:
        return jsonify({'success': False, 'error': str(error)}), 400

    if fecha_nac and fecha_fal and fecha_nac > fecha_fal:
        return jsonify({'success': False, 'error': 'La fecha de nacimiento no puede ser posterior a la fecha de fallecimiento.'}), 400

    deceased_data = estado != 'Disponible'
    try:
        if not is_location_within_patio(patio, latitud, longitud):
            return jsonify({
                'success': False,
                'error': 'La ubicación de la sepultura debe estar dentro del polígono del patio seleccionado.'
            }), 400
    except ValueError as error:
        return jsonify({'success': False, 'error': str(error)}), 409

    sepultura = Sepultura(
        numero=numero,
        patio_id=patio.id,
        sector=sector,
        tipo=tipo,
        estado=estado,
        nombre_fallecido=(data.get('nombre_fallecido', '').strip() or None) if deceased_data else None,
        apellido_paterno=(data.get('apellido_paterno', '').strip() or None) if deceased_data else None,
        apellido_materno=(data.get('apellido_materno', '').strip() or None) if deceased_data else None,
        fecha_nacimiento=fecha_nac if deceased_data else None,
        fecha_fallecimiento=fecha_fal if deceased_data else None,
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

    try:
        latitud, longitud = parse_coordinates(
            data.get('latitud', sepultura.latitud)
            if data.get('latitud') is not None else sepultura.latitud,
            data.get('longitud', sepultura.longitud)
            if data.get('longitud') is not None else sepultura.longitud
        )
        fecha_nac = (
            parse_optional_date(data['fecha_nacimiento'], 'La fecha de nacimiento')
            if 'fecha_nacimiento' in data else sepultura.fecha_nacimiento
        )
        fecha_fal = (
            parse_optional_date(data['fecha_fallecimiento'], 'La fecha de fallecimiento')
            if 'fecha_fallecimiento' in data else sepultura.fecha_fallecimiento
        )
    except ValueError as error:
        return jsonify({'success': False, 'error': str(error)}), 400

    if fecha_nac and fecha_fal and fecha_nac > fecha_fal:
        return jsonify({'success': False, 'error': 'La fecha de nacimiento no puede ser posterior a la fecha de fallecimiento.'}), 400

    target_patio = sepultura.patio
    if 'patio_numero' in data or 'patio_id' in data:
        if data.get('patio_numero') is not None:
            target_patio = Patio.query.filter_by(numero=data['patio_numero']).first()
        elif data.get('patio_id') is not None:
            target_patio = Patio.query.filter_by(id=data['patio_id']).first()
        if not target_patio:
            return jsonify({'success': False, 'error': 'El patio seleccionado no existe.'}), 404

    location_changed = (
        target_patio.id != sepultura.patio_id
        or latitud != sepultura.latitud
        or longitud != sepultura.longitud
    )
    if location_changed:
        try:
            if not is_location_within_patio(target_patio, latitud, longitud):
                return jsonify({
                    'success': False,
                    'error': 'La ubicación de la sepultura debe estar dentro del polígono del patio seleccionado.'
                }), 400
        except ValueError as error:
            return jsonify({'success': False, 'error': str(error)}), 409

    if 'numero' in data:
        sepultura.numero = str(data['numero']).strip()
    if 'patio_numero' in data or 'patio_id' in data:
        sepultura.patio_id = target_patio.id
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
        sepultura.fecha_nacimiento = fecha_nac
    if 'fecha_fallecimiento' in data:
        sepultura.fecha_fallecimiento = fecha_fal
    if data.get('estado') == 'Disponible':
        sepultura.nombre_fallecido = None
        sepultura.apellido_paterno = None
        sepultura.apellido_materno = None
        sepultura.fecha_nacimiento = None
        sepultura.fecha_fallecimiento = None
    if 'observaciones' in data:
        sepultura.observaciones = data['observaciones']
    if 'ubicacion_detalle' in data:
        sepultura.ubicacion_detalle = data['ubicacion_detalle']
    sepultura.latitud = latitud
    sepultura.longitud = longitud
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
        return jsonify({
            'success': False,
            'error': 'El borrado permanente está deshabilitado. Las sepulturas solo pueden darse de baja.'
        }), 400

    sepultura.is_deleted = True

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Sepultura {sepultura.numero} dada de baja correctamente'
    }), 200

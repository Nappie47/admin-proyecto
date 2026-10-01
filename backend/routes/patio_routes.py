from flask import Blueprint, jsonify, request
from extensions import db
from models.patio import Patio
from models.user import User
from models.sepultura import Sepultura
from models.mausoleo import MausoleoHistorico
from routes.auth_routes import role_required
from datetime import date
import json
import math
import random

patio_bp = Blueprint('patios', __name__, url_prefix='/api/patios')

def _orientation(first, second, third):
    return (
        (second[0] - first[0]) * (third[1] - first[1])
        - (second[1] - first[1]) * (third[0] - first[0])
    )

def _segments_intersect(first_start, first_end, second_start, second_end):
    epsilon = 1e-12
    orientations = (
        _orientation(first_start, first_end, second_start),
        _orientation(first_start, first_end, second_end),
        _orientation(second_start, second_end, first_start),
        _orientation(second_start, second_end, first_end)
    )
    if (
        (orientations[0] > epsilon and orientations[1] < -epsilon
         or orientations[0] < -epsilon and orientations[1] > epsilon)
        and (orientations[2] > epsilon and orientations[3] < -epsilon
             or orientations[2] < -epsilon and orientations[3] > epsilon)
    ):
        return True

    for point, start, end, orientation in (
        (second_start, first_start, first_end, orientations[0]),
        (second_end, first_start, first_end, orientations[1]),
        (first_start, second_start, second_end, orientations[2]),
        (first_end, second_start, second_end, orientations[3])
    ):
        if (
            abs(orientation) <= epsilon
            and min(start[0], end[0]) - epsilon <= point[0] <= max(start[0], end[0]) + epsilon
            and min(start[1], end[1]) - epsilon <= point[1] <= max(start[1], end[1]) + epsilon
        ):
            return True
    return False

def _point_in_ring(longitude, latitude, ring):
    inside = False
    for index in range(len(ring) - 1):
        first_lon, first_lat = ring[index][:2]
        second_lon, second_lat = ring[index + 1][:2]
        if _segments_intersect(
            (first_lon, first_lat),
            (second_lon, second_lat),
            (longitude, latitude),
            (longitude, latitude)
        ):
            return True
        if (first_lat > latitude) != (second_lat > latitude):
            crossing_lon = (
                (second_lon - first_lon) * (latitude - first_lat)
                / (second_lat - first_lat)
                + first_lon
            )
            if longitude < crossing_lon:
                inside = not inside
    return inside

def _validate_ring(ring):
    if any(ring[index][:2] == ring[index + 1][:2] for index in range(len(ring) - 1)):
        raise ValueError('El polígono no puede tener vértices consecutivos repetidos.')

    area = sum(
        ring[index][0] * ring[index + 1][1] - ring[index + 1][0] * ring[index][1]
        for index in range(len(ring) - 1)
    )
    if abs(area) <= 1e-12:
        raise ValueError('El polígono debe encerrar un área y no puede ser degenerado.')

    segment_count = len(ring) - 1
    for first_index in range(segment_count):
        for second_index in range(first_index + 1, segment_count):
            if second_index == first_index + 1 or (
                first_index == 0 and second_index == segment_count - 1
            ):
                continue
            if _segments_intersect(
                ring[first_index][:2],
                ring[first_index + 1][:2],
                ring[second_index][:2],
                ring[second_index + 1][:2]
            ):
                raise ValueError('El polígono no puede cruzarse ni tocarse a sí mismo.')

def _validate_polygon_rings(rings):
    for ring in rings:
        _validate_ring(ring)

    shell = rings[0]
    for hole_index, hole in enumerate(rings[1:], start=1):
        if not _point_in_ring(hole[0][0], hole[0][1], shell):
            raise ValueError('Los anillos interiores deben quedar dentro del perímetro del patio.')
        if any(
            _segments_intersect(
                shell[index][:2], shell[index + 1][:2],
                hole[edge_index][:2], hole[edge_index + 1][:2]
            )
            for index in range(len(shell) - 1)
            for edge_index in range(len(hole) - 1)
        ):
            raise ValueError('Los anillos interiores no pueden cruzar el perímetro del patio.')
        for previous_hole in rings[1:hole_index]:
            if _point_in_ring(hole[0][0], hole[0][1], previous_hole) or _point_in_ring(
                previous_hole[0][0], previous_hole[0][1], hole
            ) or any(
                _segments_intersect(
                    hole[index][:2], hole[index + 1][:2],
                    previous_hole[edge_index][:2], previous_hole[edge_index + 1][:2]
                )
                for index in range(len(hole) - 1)
                for edge_index in range(len(previous_hole) - 1)
            ):
                raise ValueError('Los anillos interiores no pueden superponerse entre sí.')

def _parse_patio_number(value):
    if isinstance(value, bool):
        raise ValueError('El número de patio debe ser un entero positivo.')
    try:
        number = int(value)
    except (TypeError, ValueError, OverflowError) as error:
        raise ValueError('El número de patio debe ser un entero positivo.') from error
    if str(value).strip() != str(number) or number <= 0:
        raise ValueError('El número de patio debe ser un entero positivo.')
    return number

def _parse_surface(value):
    if isinstance(value, bool):
        raise ValueError('La superficie debe ser un número mayor o igual a cero.')
    try:
        surface = float(value or 0.0)
    except (TypeError, ValueError, OverflowError) as error:
        raise ValueError('La superficie debe ser un número mayor o igual a cero.') from error
    if not math.isfinite(surface) or surface < 0:
        raise ValueError('La superficie debe ser un número finito mayor o igual a cero.')
    return surface

def parse_geometry(geom_raw):
    """Auxiliar para convertir entradas flexibles de coordenadas a GeoJSON Polygon estándar"""
    if geom_raw is None:
        return None
    if isinstance(geom_raw, str):
        try:
            geom_raw = json.loads(geom_raw)
        except (TypeError, ValueError) as error:
            raise ValueError('La geometría debe ser un GeoJSON válido.') from error

    if isinstance(geom_raw, dict):
        if geom_raw.get('type') != 'Polygon':
            raise ValueError('La geometría del patio debe ser un Polygon.')
        coordinates = geom_raw.get('coordinates')
        close_open_ring = False
    elif isinstance(geom_raw, list):
        # Asume lista de coordenadas [[lng, lat], ...] o [[[lng, lat], ...]]
        if not geom_raw or not isinstance(geom_raw[0], list):
            raise ValueError('La geometría debe contener un anillo de coordenadas.')
        if geom_raw[0] and isinstance(geom_raw[0][0], (int, float)):
            coordinates = [geom_raw]
        else:
            coordinates = geom_raw
        close_open_ring = True
    else:
        raise ValueError('La geometría debe ser un GeoJSON Polygon.')

    if not isinstance(coordinates, list) or not coordinates:
        raise ValueError('El polígono debe contener al menos un anillo.')

    for ring_index, ring in enumerate(coordinates):
        if not isinstance(ring, list) or len(ring) < 3:
            raise ValueError('Cada anillo del polígono debe tener al menos tres vértices.')
        normalized_ring = []
        for point in ring:
            if not isinstance(point, (list, tuple)) or len(point) < 2:
                raise ValueError('Cada vértice debe incluir longitud y latitud.')
            longitude, latitude = point[:2]
            if (
                isinstance(longitude, bool)
                or isinstance(latitude, bool)
                or not isinstance(longitude, (int, float))
                or not isinstance(latitude, (int, float))
            ):
                raise ValueError('El polígono contiene coordenadas geográficas inválidas.')
            try:
                coordinates_are_finite = math.isfinite(longitude) and math.isfinite(latitude)
            except OverflowError:
                coordinates_are_finite = False
            if (
                not coordinates_are_finite
                or not -180 <= longitude <= 180
                or not -90 <= latitude <= 90
            ):
                raise ValueError('El polígono contiene coordenadas geográficas inválidas.')
            normalized_ring.append(list(point))

        if normalized_ring[0] != normalized_ring[-1]:
            if not close_open_ring:
                raise ValueError('Cada anillo del GeoJSON debe estar cerrado.')
            normalized_ring.append(normalized_ring[0])
        if len(normalized_ring) < 4:
            raise ValueError('Cada anillo del polígono debe tener al menos tres vértices.')

        coordinates[ring_index] = normalized_ring

    _validate_polygon_rings(coordinates)
    return json.dumps({'type': 'Polygon', 'coordinates': coordinates})

@patio_bp.route('', methods=['GET'])
def get_patios():
    """Lista todos los patios del Cementerio General de Los Ángeles"""
    patios = Patio.query.order_by(Patio.numero.asc()).all()
    return jsonify({
        'success': True,
        'patios': [p.to_dict() for p in patios]
    }), 200

@patio_bp.route('/<int:id>', methods=['GET'])
def get_patio(id):
    patio = Patio.query.get_or_404(id)
    return jsonify({
        'success': True,
        'patio': patio.to_dict()
    }), 200

@patio_bp.route('', methods=['POST'])
@role_required('administrador', 'funcionario')
def create_patio():
    """Crea un nuevo patio con sus límites geoespaciales directamente en la base de datos"""
    data = request.get_json() or {}
    nombre = data.get('nombre')
    if not isinstance(nombre, str) or not nombre.strip() or not data.get('numero'):
        return jsonify({'success': False, 'error': 'Nombre y número son obligatorios'}), 400

    try:
        numero = _parse_patio_number(data['numero'])
        superficie = _parse_surface(data.get('superficie_m2', 0.0))
    except ValueError as error:
        return jsonify({'success': False, 'error': str(error)}), 400

    if Patio.query.filter_by(numero=numero).first():
        return jsonify({'success': False, 'error': f"El patio número {numero} ya existe"}), 400

    geom_raw = data.get('geom_geojson', data.get('geometry', data.get('coordinates')))
    try:
        geom = parse_geometry(geom_raw)
    except ValueError as error:
        return jsonify({'success': False, 'error': str(error)}), 400
    if geom is None:
        return jsonify({'success': False, 'error': 'La geometría del patio es obligatoria.'}), 400

    patio = Patio(
        numero=numero,
        nombre=nombre.strip(),
        descripcion=data.get('descripcion', ''),
        superficie_m2=superficie,
        color_hex=data.get('color_hex', '#2d6a4f'),
        geom_geojson=geom
    )
    db.session.add(patio)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f"Patio {patio.numero} creado exitosamente en PostgreSQL (10.0.3.10:5000)",
        'patio': patio.to_dict()
    }), 201

@patio_bp.route('/<int:id>', methods=['PUT'])
@role_required('administrador', 'funcionario')
def update_patio(id):
    """Actualiza un patio y sus límites cartográficos"""
    patio = Patio.query.get_or_404(id)
    data = request.get_json() or {}

    geometry_key = next(
        (key for key in ('geom_geojson', 'geometry', 'coordinates') if key in data),
        None
    )
    geometry = None
    if geometry_key is not None:
        try:
            geometry = parse_geometry(data[geometry_key])
        except ValueError as error:
            return jsonify({'success': False, 'error': str(error)}), 400
        if geometry is None:
            return jsonify({'success': False, 'error': 'La geometría del patio no puede estar vacía.'}), 400

    try:
        nuevo_num = _parse_patio_number(data['numero']) if 'numero' in data else patio.numero
        superficie = _parse_surface(data['superficie_m2']) if 'superficie_m2' in data else patio.superficie_m2
    except ValueError as error:
        return jsonify({'success': False, 'error': str(error)}), 400

    if 'nombre' in data and (not isinstance(data['nombre'], str) or not data['nombre'].strip()):
        return jsonify({'success': False, 'error': 'El nombre del patio no puede estar vacío.'}), 400

    if 'numero' in data:
        existente = Patio.query.filter_by(numero=nuevo_num).first()
        if existente and existente.id != patio.id:
            return jsonify({'success': False, 'error': f"El patio número {nuevo_num} ya existe"}), 400

    if 'nombre' in data:
        patio.nombre = data['nombre'].strip()
    if 'descripcion' in data:
        patio.descripcion = data['descripcion']
    if 'superficie_m2' in data:
        patio.superficie_m2 = superficie
    if 'color_hex' in data:
        patio.color_hex = data['color_hex']
    if 'numero' in data:
        patio.numero = nuevo_num

    if geometry_key is not None:
        patio.geom_geojson = geometry

    db.session.commit()
    return jsonify({
        'success': True,
        'message': f"Patio {patio.numero} actualizado correctamente en la base de datos",
        'patio': patio.to_dict()
    }), 200

@patio_bp.route('/<int:id>', methods=['DELETE'])
@role_required('administrador', 'funcionario')
def delete_patio(id):
    """Elimina un patio solo cuando no tiene sepulturas asociadas"""
    patio = Patio.query.get_or_404(id)
    if Sepultura.query.filter_by(patio_id=patio.id).first():
        return jsonify({
            'success': False,
            'error': f'No se puede eliminar el Patio {patio.numero} porque tiene sepulturas asociadas.'
        }), 409

    num = patio.numero
    db.session.delete(patio)
    db.session.commit()
    return jsonify({
        'success': True,
        'message': f"Patio {num} eliminado exitosamente de la base de datos"
    }), 200

@patio_bp.route('/geojson', methods=['GET'])
def get_patios_geojson():
    """GeoJSON FeatureCollection de los patios para Leaflet"""
    patios = Patio.query.order_by(Patio.numero.asc()).all()
    features = [p.to_geojson_feature() for p in patios if p.geom_geojson]
    return jsonify({
        'type': 'FeatureCollection',
        'features': features
    }), 200

@patio_bp.route('/bootstrap', methods=['POST'])
@role_required('administrador')
def bootstrap_database():
    """Deshabilitado para impedir que la inicialización sobrescriba datos reales."""
    return jsonify({
        'success': False,
        'error': 'La inicialización automática está deshabilitada. Registra los patios y cuentas con datos reales.'
    }), 410

    try:
        # 1. Asegurar tablas
        db.create_all()

        # 2. Patios oficiales del Cementerio de Los Ángeles (Camino San Antonio s/n)
        patios_def = [
            {
                "numero": 1,
                "nombre": "Patio 1 - Acceso Histórico y Panteón",
                "descripcion": "Sector fundacional del cementerio, contiene mausoleos patrimoniales y sepulturas del siglo XIX y XX.",
                "superficie_m2": 4500.0,
                "color_hex": "#1b4332",
                "coords": [[-72.3245, -37.4718], [-72.3228, -37.4718], [-72.3228, -37.4730], [-72.3245, -37.4730], [-72.3245, -37.4718]]
            },
            {
                "numero": 2,
                "nombre": "Patio 2 - Sector Central y Familias",
                "descripcion": "Patio central de alta densidad con arboledas nativas y sepulturas familiares.",
                "superficie_m2": 5200.0,
                "color_hex": "#2d6a4f",
                "coords": [[-72.3228, -37.4718], [-72.3212, -37.4718], [-72.3212, -37.4730], [-72.3228, -37.4730], [-72.3228, -37.4718]]
            },
            {
                "numero": 3,
                "nombre": "Patio 3 - Pradera Sur y Pabellones",
                "descripcion": "Zona sur del recinto con diseño de parque abierto y nichos perimetrales.",
                "superficie_m2": 6100.0,
                "color_hex": "#40916c",
                "coords": [[-72.3245, -37.4730], [-72.3228, -37.4730], [-72.3228, -37.4745], [-72.3245, -37.4745], [-72.3245, -37.4730]]
            },
            {
                "numero": 4,
                "nombre": "Patio 4 - Avenida Los Álamos",
                "descripcion": "Sector oriente caracterizado por hileras de árboles y sepulturas en tierra individuales.",
                "superficie_m2": 5800.0,
                "color_hex": "#52b788",
                "coords": [[-72.3228, -37.4730], [-72.3212, -37.4730], [-72.3212, -37.4745], [-72.3228, -37.4745], [-72.3228, -37.4730]]
            },
            {
                "numero": 5,
                "nombre": "Patio 5 - Ampliación Moderna",
                "descripcion": "Última fase de actualización topográfica con catastro digital unificado.",
                "superficie_m2": 4900.0,
                "color_hex": "#74c69d",
                "coords": [[-72.3245, -37.4745], [-72.3212, -37.4745], [-72.3212, -37.4755], [-72.3245, -37.4755], [-72.3245, -37.4745]]
            }
        ]

        patios_creados = 0
        for pdata in patios_def:
            p = Patio.query.filter_by(numero=pdata['numero']).first()
            geom_json = json.dumps({"type": "Polygon", "coordinates": [pdata['coords']]})
            if not p:
                p = Patio(
                    numero=pdata['numero'],
                    nombre=pdata['nombre'],
                    descripcion=pdata['descripcion'],
                    superficie_m2=pdata['superficie_m2'],
                    color_hex=pdata['color_hex'],
                    geom_geojson=geom_json
                )
                db.session.add(p)
                patios_creados += 1
            else:
                p.nombre = pdata['nombre']
                p.descripcion = pdata['descripcion']
                p.superficie_m2 = pdata['superficie_m2']
                p.color_hex = pdata['color_hex']
                p.geom_geojson = geom_json
        db.session.commit()

        # 3. Usuario Administrador y Funcionarios
        usuarios_def = [
            ("admin", "admin@losangeles.cl", "Admin123!", "Administrador General Municipal", "administrador"),
            ("funcionario", "funcionario@losangeles.cl", "Funcionario123!", "Juan Encargado Catastro", "funcionario"),
            ("terreno", "terreno@losangeles.cl", "Terreno123!", "Validador Topográfico Terreno", "funcionario"),
        ]
        usuarios_creados = 0
        for un, ue, pw, nom, rol in usuarios_def:
            u = User.query.filter((User.username == un) | (User.email == ue)).first()
            if not u:
                u = User(username=un, email=ue, nombre_completo=nom, rol=rol, activo=True)
                u.set_password(pw)
                db.session.add(u)
                usuarios_creados += 1
            else:
                u.rol = rol
                u.activo = True
                u.set_password(pw)
        db.session.commit()

        # 4. Generar sepulturas iniciales si la tabla está vacía
        sep_count = Sepultura.query.count()
        if sep_count == 0:
            apellidos = ['González', 'Muñoz', 'Rojas', 'Díaz', 'Pérez', 'Soto', 'Contreras', 'Silva', 'Martínez', 'Sepúlveda', 'Morales', 'Rodríguez', 'López', 'Fuentes', 'Valenzuela']
            nombres = ['Juan', 'José', 'Manuel', 'María', 'Carmen', 'Rosa', 'Luis', 'Carlos', 'Jorge', 'Pedro', 'Ana', 'Marta', 'Elena', 'Francisco', 'Héctor']
            todos_patios = Patio.query.all()
            
            for patio in todos_patios:
                # Extraer bounding box aproximado de coords
                try:
                    g = json.loads(patio.geom_geojson)
                    ring = g['coordinates'][0]
                    lons = [pt[0] for pt in ring]
                    lats = [pt[1] for pt in ring]
                    min_lon, max_lon = min(lons), max(lons)
                    min_lat, max_lat = min(lats), max(lats)
                except Exception:
                    min_lon, max_lon = -72.3240, -72.3220
                    min_lat, max_lat = -37.4740, -37.4720

                for i in range(1, 16): # 15 sepulturas por patio (75 en total)
                    num = f"P{patio.numero}-{100 + i}"
                    estado = random.choices(['Ocupada', 'Disponible', 'En Mantenimiento'], weights=[0.75, 0.20, 0.05])[0]
                    nom_f = random.choice(nombres) if estado == 'Ocupada' else None
                    ap_p = random.choice(apellidos) if estado == 'Ocupada' else None
                    ap_m = random.choice(apellidos) if estado == 'Ocupada' else None

                    lat = random.uniform(min_lat + 0.0001, max_lat - 0.0001)
                    lon = random.uniform(min_lon + 0.0001, max_lon - 0.0001)

                    sep = Sepultura(
                        numero=num,
                        patio_id=patio.id,
                        sector=random.choice(['A', 'B', 'C', 'D']),
                        tipo=random.choice(['Individual', 'Familiar', 'Nicho']),
                        estado=estado,
                        nombre_fallecido=nom_f,
                        apellido_paterno=ap_p,
                        apellido_materno=ap_m,
                        fecha_nacimiento=date(random.randint(1920, 1970), random.randint(1, 12), random.randint(1, 28)) if estado == 'Ocupada' else None,
                        fecha_fallecimiento=date(random.randint(1980, 2023), random.randint(1, 12), random.randint(1, 28)) if estado == 'Ocupada' else None,
                        ubicacion_detalle=f"Patio {patio.numero}, Fila {random.randint(1, 10)}, Tumba {i}",
                        latitud=lat,
                        longitud=lon,
                        geom_geojson=json.dumps({"type": "Point", "coordinates": [lon, lat]})
                    )
                    db.session.add(sep)
            db.session.commit()

        # 5. Mausoleos Patrimoniales
        maus_count = MausoleoHistorico.query.count()
        if maus_count == 0:
            patio_1 = Patio.query.filter_by(numero=1).first()
            p1_id = patio_1.id if patio_1 else None
            m1 = MausoleoHistorico(
                nombre="Mausoleo de la Familia Rivas",
                familia="Familia Rivas",
                ano_construccion=1933,
                arquitecto="Don Alberto Cruz Eyzaguirre",
                estilo_arquitectonico="Neoclásico Republicano",
                resena_historica="Construido en 1933 con mármol travertino y ornamentación en bronce.",
                foto_url="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
                patio_id=p1_id,
                latitud=-37.47225,
                longitud=-72.32350,
                destacado=True
            )
            m2 = MausoleoHistorico(
                nombre="Mausoleo de los Fundadores de Los Ángeles",
                familia="Panteón Cívico Comunal",
                ano_construccion=1895,
                arquitecto="Hermenegildo Balbontín",
                estilo_arquitectonico="Clásico Monumental",
                resena_historica="Monumento funerario en honor a los primeros colonizadores del siglo XIX.",
                foto_url="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
                patio_id=p1_id,
                latitud=-37.47200,
                longitud=-72.32380,
                destacado=True
            )
            db.session.add(m1)
            db.session.add(m2)
            db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Base de datos inicializada exitosamente en PostgreSQL (10.0.3.10:5000)',
            'total_patios': Patio.query.count(),
            'total_usuarios': User.query.count(),
            'total_sepulturas': Sepultura.query.count(),
            'total_mausoleos': MausoleoHistorico.query.count()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

from flask import Blueprint, jsonify, request
from extensions import db
from models.patio import Patio
from models.user import User
from models.sepultura import Sepultura
from models.mausoleo import MausoleoHistorico
from datetime import date
import json
import random

patio_bp = Blueprint('patios', __name__, url_prefix='/api/patios')

def parse_geometry(geom_raw):
    """Auxiliar para convertir entradas flexibles de coordenadas a GeoJSON Polygon estándar"""
    if not geom_raw:
        return None
    if isinstance(geom_raw, str):
        try:
            geom_raw = json.loads(geom_raw)
        except Exception:
            return None
    if isinstance(geom_raw, dict):
        if geom_raw.get('type') == 'Polygon' and 'coordinates' in geom_raw:
            return json.dumps(geom_raw)
    elif isinstance(geom_raw, list):
        # Asume lista de coordenadas [[lng, lat], ...] o [[[lng, lat], ...]]
        if len(geom_raw) > 0 and isinstance(geom_raw[0], list):
            if isinstance(geom_raw[0][0], (int, float)):
                # Asegurar anillo cerrado
                ring = list(geom_raw)
                if ring[0] != ring[-1]:
                    ring.append(ring[0])
                return json.dumps({"type": "Polygon", "coordinates": [ring]})
            elif isinstance(geom_raw[0][0], list):
                return json.dumps({"type": "Polygon", "coordinates": geom_raw})
    return None

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
def create_patio():
    """Crea un nuevo patio con sus límites geoespaciales directamente en la base de datos"""
    data = request.get_json() or {}
    if not data.get('nombre') or not data.get('numero'):
        return jsonify({'success': False, 'error': 'Nombre y número son obligatorios'}), 400

    numero = int(data['numero'])
    if Patio.query.filter_by(numero=numero).first():
        return jsonify({'success': False, 'error': f"El patio número {numero} ya existe"}), 400

    geom = parse_geometry(data.get('geom_geojson') or data.get('geometry') or data.get('coordinates'))

    patio = Patio(
        numero=numero,
        nombre=data['nombre'],
        descripcion=data.get('descripcion', ''),
        superficie_m2=float(data.get('superficie_m2', 0.0) or 0.0),
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
def update_patio(id):
    """Actualiza un patio y sus límites cartográficos"""
    patio = Patio.query.get_or_404(id)
    data = request.get_json() or {}

    if 'nombre' in data:
        patio.nombre = data['nombre']
    if 'descripcion' in data:
        patio.descripcion = data['descripcion']
    if 'superficie_m2' in data:
        patio.superficie_m2 = float(data['superficie_m2'] or 0.0)
    if 'color_hex' in data:
        patio.color_hex = data['color_hex']
    if 'numero' in data:
        nuevo_num = int(data['numero'])
        existente = Patio.query.filter_by(numero=nuevo_num).first()
        if existente and existente.id != patio.id:
            return jsonify({'success': False, 'error': f"El patio número {nuevo_num} ya existe"}), 400
        patio.numero = nuevo_num

    geom_raw = data.get('geom_geojson') or data.get('geometry') or data.get('coordinates')
    if geom_raw is not None:
        patio.geom_geojson = parse_geometry(geom_raw)

    db.session.commit()
    return jsonify({
        'success': True,
        'message': f"Patio {patio.numero} actualizado correctamente en la base de datos",
        'patio': patio.to_dict()
    }), 200

@patio_bp.route('/<int:id>', methods=['DELETE'])
def delete_patio(id):
    """Elimina un patio y sus sepulturas asociadas"""
    patio = Patio.query.get_or_404(id)
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
def bootstrap_database():
    """Inicializa en la base de datos PostgreSQL (10.0.3.10:5000) los 5 patios oficiales y el usuario admin"""
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

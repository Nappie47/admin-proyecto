import json
import random
from datetime import date
from app import create_app
from extensions import db
from models.user import User
from models.patio import Patio
from models.sepultura import Sepultura
from models.mausoleo import MausoleoHistorico

from dotenv import load_dotenv

load_dotenv()

def run_seed():
    app = create_app()
    with app.app_context():
        db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        # Ocultar password en el log
        safe_uri = db_uri.split('@')[-1] if '@' in db_uri else db_uri
        print(f"[INFO] Conectando a Base de Datos: {safe_uri}")
        print("[INFO] Iniciando poblamiento de base de datos...")
        db.create_all()

        # 1. Patios (5 patios actualizados en el predio real del Cementerio General de Los Ángeles)
        # Ubicación real: Camino San Antonio s/n / Av. Gabriela Mistral (~ Lat -37.4732, Lon -72.3229)
        patios_data = [
            {
                "numero": 1,
                "nombre": "Patio 1 - Acceso Histórico y Panteón",
                "descripcion": "Sector fundacional del cementerio, contiene mausoleos patrimoniales y sepulturas del siglo XIX y XX.",
                "superficie_m2": 4500.0,
                "color_hex": "#1b4332",
                "geom": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-72.3245, -37.4718],
                        [-72.3228, -37.4718],
                        [-72.3228, -37.4730],
                        [-72.3245, -37.4730],
                        [-72.3245, -37.4718]
                    ]]
                }
            },
            {
                "numero": 2,
                "nombre": "Patio 2 - Sector Central y Familias",
                "descripcion": "Patio central de alta densidad con arboledas nativas y sepulturas familiares.",
                "superficie_m2": 5200.0,
                "color_hex": "#2d6a4f",
                "geom": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-72.3228, -37.4718],
                        [-72.3212, -37.4718],
                        [-72.3212, -37.4730],
                        [-72.3228, -37.4730],
                        [-72.3228, -37.4718]
                    ]]
                }
            },
            {
                "numero": 3,
                "nombre": "Patio 3 - Pradera Sur y Pabellones",
                "descripcion": "Zona sur del recinto con diseño de parque abierto y nichos perimetrales.",
                "superficie_m2": 6100.0,
                "color_hex": "#40916c",
                "geom": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-72.3245, -37.4730],
                        [-72.3228, -37.4730],
                        [-72.3228, -37.4745],
                        [-72.3245, -37.4745],
                        [-72.3245, -37.4730]
                    ]]
                }
            },
            {
                "numero": 4,
                "nombre": "Patio 4 - Avenida Los Álamos",
                "descripcion": "Sector oriente caracterizado por hileras de árboles y sepulturas en tierra individuales.",
                "superficie_m2": 5800.0,
                "color_hex": "#52b788",
                "geom": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-72.3228, -37.4730],
                        [-72.3212, -37.4730],
                        [-72.3212, -37.4745],
                        [-72.3228, -37.4745],
                        [-72.3228, -37.4730]
                    ]]
                }
            },
            {
                "numero": 5,
                "nombre": "Patio 5 - Ampliación Moderna",
                "descripcion": "Última fase de actualización topográfica con catastro digital unificado.",
                "superficie_m2": 4900.0,
                "color_hex": "#74c69d",
                "geom": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-72.3245, -37.4745],
                        [-72.3212, -37.4745],
                        [-72.3212, -37.4755],
                        [-72.3245, -37.4755],
                        [-72.3245, -37.4745]
                    ]]
                }
            }
        ]

        patio_map = {}
        for pdata in patios_data:
            p = Patio.query.filter_by(numero=pdata['numero']).first()
            if not p:
                p = Patio(
                    numero=pdata['numero'],
                    nombre=pdata['nombre'],
                    descripcion=pdata['descripcion'],
                    superficie_m2=pdata['superficie_m2'],
                    color_hex=pdata['color_hex'],
                    geom_geojson=json.dumps(pdata['geom'])
                )
                db.session.add(p)
                db.session.flush()
            patio_map[p.numero] = p
        db.session.commit()
        print(f"[OK] {len(patio_map)} patios configurados.")

        # 2. Usuarios del sistema (RF01, RF02, RF03)
        usuarios_data = [
            {
                "username": "admin",
                "email": "admin@losangeles.cl",
                "password": "Admin123!",
                "nombre_completo": "Administrador General Municipal",
                "rol": "administrador"
            },
            {
                "username": "funcionario",
                "email": "funcionario@losangeles.cl",
                "password": "Funcionario123!",
                "nombre_completo": "Juan Encargado Catastro",
                "rol": "funcionario"
            },
            {
                "username": "terreno",
                "email": "terreno@losangeles.cl",
                "password": "Terreno123!",
                "nombre_completo": "Validador Topográfico Terreno",
                "rol": "funcionario"
            }
        ]

        for udata in usuarios_data:
            u = User.query.filter((User.username == udata['username']) | (User.email == udata['email'])).first()
            if not u:
                u = User(
                    username=udata['username'],
                    email=udata['email'],
                    nombre_completo=udata['nombre_completo'],
                    rol=udata['rol'],
                    activo=True
                )
                u.set_password(udata['password'])
                db.session.add(u)
        db.session.commit()
        print("[OK] Usuarios iniciales creados (admin, funcionario, terreno).")

        # 3. Mausoleos Históricos (RF12 - Catastro histórico, 12 cargados inicialmente de los 40)
        mausoleos_data = [
            {
                "nombre": "Mausoleo de la Familia Rivas",
                "familia": "Familia Rivas",
                "ano_construccion": 1933,
                "arquitecto": "Don Alberto Cruz Eyzaguirre",
                "estilo_arquitectonico": "Neoclásico Republicano",
                "resena_historica": "Construido en 1933, es uno de los ejemplos más representativos de la arquitectura funeraria de nuestra ciudad. Edificado con mármol travertino y ornamentación en bronce, resguarda los restos de los fundadores del comercio local.",
                "foto_url": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
                "patio_numero": 1,
                "latitud": -37.47225,
                "longitud": -72.32350,
                "destacado": True
            },
            {
                "nombre": "Mausoleo de los Fundadores de Los Ángeles",
                "familia": "Panteón Cívico Comunal",
                "ano_construccion": 1895,
                "arquitecto": "Hermenegildo Balbontín",
                "estilo_arquitectonico": "Clásico Monumental",
                "resena_historica": "Monumento funerario erigido en honor a los primeros colonizadores y alcaldes del siglo XIX en la Villa de Los Ángeles.",
                "foto_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
                "patio_numero": 1,
                "latitud": -37.47200,
                "longitud": -72.32380,
                "destacado": True
            },
            {
                "nombre": "Mausoleo Familia Arteaga",
                "familia": "Familia Arteaga Vial",
                "ano_construccion": 1928,
                "arquitecto": "Luciano Kulczewski",
                "estilo_arquitectonico": "Art Déco Funerario",
                "resena_historica": "Destacada estructura de granito negro y líneas geométricas puras, testimonio del modernismo de principios del siglo XX.",
                "foto_url": "https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=800&q=80",
                "patio_numero": 2,
                "latitud": -37.47240,
                "longitud": -72.32200,
                "destacado": True
            },
            {
                "nombre": "Mausoleo de la Sociedad de Socorros Mutuos",
                "familia": "Sociedad de Artesanos",
                "ano_construccion": 1915,
                "arquitecto": "Comité de Artesanos de Biobío",
                "estilo_arquitectonico": "Neogótico",
                "resena_historica": "Homenaje de fraternidad obrera levantado por las agrupaciones gremiales y obreras de la provincia de Biobío.",
                "foto_url": "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80",
                "patio_numero": 2,
                "latitud": -37.47270,
                "longitud": -72.32240,
                "destacado": True
            },
            {
                "nombre": "Mausoleo Héroes de la Guerra del Pacífico",
                "familia": "Veteranos del 79",
                "ano_construccion": 1902,
                "arquitecto": "Ingenieros Militares",
                "estilo_arquitectonico": "Conmemorativo Militar",
                "resena_historica": "Resguarda los restos de los soldados angelinos del Batallón Cívico Los Ángeles que combatieron en el norte.",
                "foto_url": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
                "patio_numero": 1,
                "latitud": -37.47230,
                "longitud": -72.32310,
                "destacado": False
            },
            {
                "nombre": "Mausoleo de los Educadores Notables",
                "familia": "Gremio Docente",
                "ano_construccion": 1950,
                "arquitecto": "Mario Recordón",
                "estilo_arquitectonico": "Racionalista",
                "resena_historica": "Dedicado a maestros y profesores normalistas que fundaron los primeros colegios públicos de la comarca.",
                "foto_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
                "patio_numero": 3,
                "latitud": -37.47350,
                "longitud": -72.32340,
                "destacado": False
            }
        ]

        for mdata in mausoleos_data:
            m = MausoleoHistorico.query.filter_by(nombre=mdata['nombre']).first()
            if not m:
                patio_obj = patio_map.get(mdata['patio_numero'])
                m = MausoleoHistorico(
                    nombre=mdata['nombre'],
                    familia=mdata['familia'],
                    ano_construccion=mdata['ano_construccion'],
                    arquitecto=mdata['arquitecto'],
                    estilo_arquitectonico=mdata['estilo_arquitectonico'],
                    resena_historica=mdata['resena_historica'],
                    foto_url=mdata['foto_url'],
                    patio_id=patio_obj.id if patio_obj else None,
                    latitud=mdata['latitud'],
                    longitud=mdata['longitud'],
                    destacado=mdata['destacado']
                )
                db.session.add(m)
        db.session.commit()
        print("[OK] Mausoleos patrimoniales precargados.")

        # 4. Sepulturas (Exactas de los Mockups + Muestra amplia realista)
        mockup_sepulturas = [
            {
                "numero": "104",
                "patio_numero": 2,
                "sector": "B",
                "tipo": "Individual",
                "estado": "Ocupada",
                "nombre_fallecido": "Juan",
                "apellido_paterno": "Pérez",
                "apellido_materno": "González",
                "fecha_nacimiento": date(1942, 4, 15),
                "fecha_fallecimiento": date(2020, 3, 12),
                "observaciones": "Sepultura de uso individual. Mantenimiento general en buen estado. Sin observaciones adicionales.",
                "ubicacion_detalle": "Patio 2, Fila 4, Número 104",
                "latitud": -37.47230,
                "longitud": -72.32200
            },
            {
                "numero": "027",
                "patio_numero": 1,
                "sector": "A",
                "tipo": "Individual",
                "estado": "Ocupada",
                "nombre_fallecido": "María",
                "apellido_paterno": "Gómez",
                "apellido_materno": "Soto",
                "fecha_nacimiento": date(1950, 6, 3),
                "fecha_fallecimiento": date(2018, 8, 28),
                "observaciones": "Placa de mármol blanco en óptimas condiciones.",
                "ubicacion_detalle": "Patio 1, Fila 2, Número 027",
                "latitud": -37.47210,
                "longitud": -72.32330
            },
            {
                "numero": "198",
                "patio_numero": 3,
                "sector": "C",
                "tipo": "Individual",
                "estado": "Ocupada",
                "nombre_fallecido": "Carlos",
                "apellido_paterno": "Rodríguez",
                "apellido_materno": "Bravo",
                "fecha_nacimiento": date(1935, 11, 22),
                "fecha_fallecimiento": date(2012, 1, 17),
                "observaciones": "Mantención al día por familiares.",
                "ubicacion_detalle": "Patio 3, Fila 8, Número 198",
                "latitud": -37.47380,
                "longitud": -72.32360
            },
            {
                "numero": "052",
                "patio_numero": 4,
                "sector": "A",
                "tipo": "Individual",
                "estado": "Ocupada",
                "nombre_fallecido": "Ana",
                "apellido_paterno": "Martínez",
                "apellido_materno": "Vidal",
                "fecha_nacimiento": date(1968, 2, 9),
                "fecha_fallecimiento": date(2021, 9, 4),
                "observaciones": "Jardinera con flores naturales ornamentales.",
                "ubicacion_detalle": "Patio 4, Fila 3, Número 052",
                "latitud": -37.47370,
                "longitud": -72.32180
            },
            {
                "numero": "089",
                "patio_numero": 1,
                "sector": "D",
                "tipo": "Individual",
                "estado": "Ocupada",
                "nombre_fallecido": "José",
                "apellido_paterno": "López",
                "apellido_materno": "Fuentes",
                "fecha_nacimiento": date(1941, 5, 11),
                "fecha_fallecimiento": date(2005, 10, 30),
                "observaciones": "Sin deudas municipales registradas.",
                "ubicacion_detalle": "Patio 1, Fila 5, Número 089",
                "latitud": -37.47260,
                "longitud": -72.32370
            },
            {
                "numero": "145",
                "patio_numero": 2,
                "sector": "B",
                "tipo": "Individual",
                "estado": "Disponible",
                "nombre_fallecido": None,
                "apellido_paterno": None,
                "apellido_materno": None,
                "fecha_nacimiento": None,
                "fecha_fallecimiento": None,
                "observaciones": "Sitio disponible para concesión o asignación.",
                "ubicacion_detalle": "Patio 2, Fila 6, Número 145",
                "latitud": -37.47220,
                "longitud": -72.32230
            },
            {
                "numero": "203",
                "patio_numero": 3,
                "sector": "A",
                "tipo": "Individual",
                "estado": "Disponible",
                "nombre_fallecido": None,
                "apellido_paterno": None,
                "apellido_materno": None,
                "fecha_nacimiento": None,
                "fecha_fallecimiento": None,
                "observaciones": "Sitio individual disponible.",
                "ubicacion_detalle": "Patio 3, Fila 2, Número 203",
                "latitud": -37.47410,
                "longitud": -72.32320
            },
            {
                "numero": "176",
                "patio_numero": 4,
                "sector": "C",
                "tipo": "Individual",
                "estado": "Disponible",
                "nombre_fallecido": None,
                "apellido_paterno": None,
                "apellido_materno": None,
                "fecha_nacimiento": None,
                "fecha_fallecimiento": None,
                "observaciones": "Espacio regularizado disponible.",
                "ubicacion_detalle": "Patio 4, Fila 7, Número 176",
                "latitud": -37.47430,
                "longitud": -72.32210
            }
        ]

        for sdata in mockup_sepulturas:
            p = patio_map.get(sdata['patio_numero'])
            existing = Sepultura.query.filter_by(numero=sdata['numero'], patio_id=p.id).first()
            if not existing:
                s = Sepultura(
                    numero=sdata['numero'],
                    patio_id=p.id,
                    sector=sdata['sector'],
                    tipo=sdata['tipo'],
                    estado=sdata['estado'],
                    nombre_fallecido=sdata['nombre_fallecido'],
                    apellido_paterno=sdata['apellido_paterno'],
                    apellido_materno=sdata['apellido_materno'],
                    fecha_nacimiento=sdata['fecha_nacimiento'],
                    fecha_fallecimiento=sdata['fecha_fallecimiento'],
                    observaciones=sdata['observaciones'],
                    ubicacion_detalle=sdata['ubicacion_detalle'],
                    latitud=sdata['latitud'],
                    longitud=sdata['longitud']
                )
                db.session.add(s)

        # Generar sepulturas adicionales para llegar a densidad realista
        nombres = ["Manuel", "Rosa", "Pedro", "Carmen", "Luis", "Teresa", "Jorge", "Patricia", "Roberto", "Elena", "Francisco", "Margarita", "Gabriel", "Silvia", "Héctor", "Claudia", "Raúl", "Isabel"]
        apellidos = ["Muñoz", "Rojas", "Díaz", "Pérez", "Soto", "Contreras", "Silva", "Martínez", "Sepúlveda", "Morales", "Araya", "Hernández", "Torres", "Castillo", "Flores", "Espinoza", "Valenzuela", "Carrasco"]
        sectores = ["A", "B", "C", "D"]
        tipos = ["Individual", "Individual", "Individual", "Familiar", "Nicho", "Mausoleo"]

        random.seed(42)
        total_created = 0

        for patio_num in range(1, 6):
            p = patio_map[patio_num]
            min_lon, max_lon = (-72.3245, -72.3228) if patio_num in [1, 3] else (-72.3228, -72.3212)
            if patio_num == 5:
                min_lon, max_lon = (-72.3245, -72.3212)
            
            min_lat, max_lat = (-37.4730, -37.4718) if patio_num in [1, 2] else (-37.4745, -37.4730)
            if patio_num == 5:
                min_lat, max_lat = (-37.4755, -37.4745)

            for i in range(1, 28):
                num_str = f"{patio_num * 100 + i:03d}"
                if Sepultura.query.filter_by(numero=num_str, patio_id=p.id).first():
                    continue

                is_ocupada = random.random() < 0.75
                estado = "Ocupada" if is_ocupada else ("Disponible" if random.random() < 0.85 else "En Mantenimiento")

                lat = round(random.uniform(min_lat, max_lat), 6)
                lon = round(random.uniform(min_lon, max_lon), 6)
                sector = random.choice(sectores)
                tipo = random.choice(tipos)

                nom = random.choice(nombres) if is_ocupada else None
                ape1 = random.choice(apellidos) if is_ocupada else None
                ape2 = random.choice(apellidos) if is_ocupada else None
                
                f_nac = date(random.randint(1920, 1970), random.randint(1, 12), random.randint(1, 28)) if is_ocupada else None
                f_fal = date(random.randint(1985, 2024), random.randint(1, 12), random.randint(1, 28)) if is_ocupada else None

                s = Sepultura(
                    numero=num_str,
                    patio_id=p.id,
                    sector=sector,
                    tipo=tipo,
                    estado=estado,
                    nombre_fallecido=nom,
                    apellido_paterno=ape1,
                    apellido_materno=ape2,
                    fecha_nacimiento=f_nac,
                    fecha_fallecimiento=f_fal,
                    observaciones=f"Registro regularizado en catastro municipal Los Ángeles - Sector {sector}." if is_ocupada else "Ubicación disponible para asignación.",
                    ubicacion_detalle=f"Patio {p.numero}, Sector {sector}, Sepultura {num_str}",
                    latitud=lat,
                    longitud=lon
                )
                db.session.add(s)
                total_created += 1

        db.session.commit()
        print(f"[OK] Sepulturas iniciales creadas (+{total_created} registros generados).")
        print("[OK] Poblamiento completado con exito.")

if __name__ == '__main__':
    run_seed()

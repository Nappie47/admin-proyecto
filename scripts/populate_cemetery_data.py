import os
import json
import random
from datetime import date, datetime, timedelta

# Script para poblar Patios, Sepulturas y Mausoleos Históricos Reales
# Basado en la historia y delimitación oficial del Cementerio General de Los Ángeles (Biobío, Chile)

PATIOS = [
    {
        "id": 1,
        "numero": 1,
        "nombre": "Patio de los Inmigrantes y Fundadores",
        "descripcion": "Sector fundacional de 1850 donado por la familia Robles. Alberga el histórico Patio de Disidentes y las tumbas de los colonos europeos de la Colonia Humán.",
        "superficie_m2": 2850.0,
        "color_hex": "#2d6a4f",
        "bounds": {
            "min_lon": -72.3235, "max_lon": -72.3214,
            "min_lat": -37.4734, "max_lat": -37.4722
        },
        "coords": [
            [-72.3235, -37.4722],
            [-72.3214, -37.4722],
            [-72.3214, -37.4734],
            [-72.3235, -37.4734],
            [-72.3235, -37.4722]
        ]
    },
    {
        "id": 2,
        "numero": 2,
        "nombre": "Patio Los Cipreses (Avenida Patrimonial)",
        "descripcion": "Eje central histórico del cementerio. Concentra los mausoleos de mayor valor arquitectónico, neoclásicos y mutualistas de la provincia del Biobío.",
        "superficie_m2": 3200.0,
        "color_hex": "#1b4332",
        "bounds": {
            "min_lon": -72.3248, "max_lon": -72.3226,
            "min_lat": -37.4739, "max_lat": -37.4728
        },
        "coords": [
            [-72.3248, -37.4728],
            [-72.3226, -37.4728],
            [-72.3226, -37.4739],
            [-72.3248, -37.4739],
            [-72.3248, -37.4728]
        ]
    },
    {
        "id": 3,
        "numero": 3,
        "nombre": "Patio San José (Sector Norte)",
        "descripcion": "Sector norponiente de sepulturas tradicionales, bóvedas de cantería y nichos perpetuos de familias angelinas tradicionales.",
        "superficie_m2": 2900.0,
        "color_hex": "#40916c",
        "bounds": {
            "min_lon": -72.3259, "max_lon": -72.3237,
            "min_lat": -37.4735, "max_lat": -37.4723
        },
        "coords": [
            [-72.3259, -37.4723],
            [-72.3237, -37.4723],
            [-72.3237, -37.4735],
            [-72.3259, -37.4735],
            [-72.3259, -37.4723]
        ]
    },
    {
        "id": 4,
        "numero": 4,
        "nombre": "Patio El Carmen (Sector Sur)",
        "descripcion": "Sector sur tradicional de sepulturas en tierra y jardines perpetuos de la comunidad angelina.",
        "superficie_m2": 2750.0,
        "color_hex": "#52b788",
        "bounds": {
            "min_lon": -72.3235, "max_lon": -72.3214,
            "min_lat": -37.4746, "max_lat": -37.4735
        },
        "coords": [
            [-72.3235, -37.4735],
            [-72.3214, -37.4735],
            [-72.3214, -37.4746],
            [-72.3235, -37.4746],
            [-72.3235, -37.4735]
        ]
    },
    {
        "id": 5,
        "numero": 5,
        "nombre": "Patio Las Acacias (Sector Poniente)",
        "descripcion": "Sector suroeste con parcelas familiares contemporáneas y mausoleos modernos de la segunda mitad del siglo XX.",
        "superficie_m2": 2800.0,
        "color_hex": "#74c69d",
        "bounds": {
            "min_lon": -72.3258, "max_lon": -72.3236,
            "min_lat": -37.4746, "max_lat": -37.4736
        },
        "coords": [
            [-72.3258, -37.4736],
            [-72.3236, -37.4736],
            [-72.3236, -37.4746],
            [-72.3258, -37.4746],
            [-72.3258, -37.4736]
        ]
    }
]

MAUSOLEOS = [
    {
        "nombre": "Mausoleo Familia de la Maza y Riquelme",
        "familia": "Familia de la Maza",
        "ano_construccion": 1885,
        "arquitecto": "Taller de Cantería y Mármol del Biobío",
        "estilo_arquitectonico": "Neoclásico Republicano con ornamentación floral",
        "resena_historica": "Monumento de gran altura y valor histórico donde descansan descendientes directos vinculados a Clorinda Riquelme de la Barrera del Río (prima hermana del Libertador Bernardo O'Higgins) y propietarios del histórico fundo Paillihue.",
        "patio_id": 1,
        "latitud": -37.47275,
        "longitud": -72.32230,
        "destacado": True
    },
    {
        "nombre": "Mausoleo Fundacional Familia Robles",
        "familia": "Familia Robles",
        "ano_construccion": 1860,
        "arquitecto": "Constructor José Tomás Robles",
        "estilo_arquitectonico": "Clásico en piedra sillar y columnas dóricas",
        "resena_historica": "Panteón de la familia benefactora que en 1850 donó los terrenos fundacionales para la creación del camposanto laico y público de Los Ángeles, dando inicio formal a la administración municipal del recinto.",
        "patio_id": 1,
        "latitud": -37.47250,
        "longitud": -72.32270,
        "destacado": True
    },
    {
        "nombre": "Mausoleo Colonos de Humán e Inmigrantes Europeos",
        "familia": "Comunidad de Inmigrantes y Disidentes",
        "ano_construccion": 1872,
        "arquitecto": "Colonos Constructores de Humán",
        "estilo_arquitectonico": "Neogótico Germánico en granito",
        "resena_historica": "Ubicado en el acceso del camposanto. Alberga los restos de los primeros colonos alemanes, suizos y austrohúngaros establecidos en la Colonia Humán a mediados del siglo XIX, hito fundacional de la provincia.",
        "patio_id": 1,
        "latitud": -37.47310,
        "longitud": -72.32180,
        "destacado": True
    },
    {
        "nombre": "Mausoleo Sociedad de Socorros Mutuos de Artesanos",
        "familia": "Sociedad de Artesanos de Los Ángeles",
        "ano_construccion": 1912,
        "arquitecto": "Gremio de Albañilería y Mutualistas de Los Ángeles",
        "estilo_arquitectonico": "Neoclásico Cívico Institucional",
        "resena_historica": "Panteón social erigido por la mutual obrera y artesana fundada a fines del siglo XIX. Representa el espíritu de solidaridad gremial y las raíces del mutualismo en la ciudad de Los Ángeles.",
        "patio_id": 2,
        "latitud": -37.47330,
        "longitud": -72.32350,
        "destacado": True
    },
    {
        "nombre": "Mausoleo Familia Rioseco y Bunster",
        "familia": "Familia Rioseco Bunster",
        "ano_construccion": 1898,
        "arquitecto": "Estudio Arquitectura Concepción-Los Ángeles",
        "estilo_arquitectonico": "Historicista Ecléctico con bóveda de medio punto",
        "resena_historica": "Panteón de una de las familias precursoras de la agricultura moderna, la industria molinera y la llegada del ferrocarril a la cuenca del Biobío durante el auge cerealero del siglo XIX.",
        "patio_id": 2,
        "latitud": -37.47355,
        "longitud": -72.32410,
        "destacado": True
    },
    {
        "nombre": "Panteón Memorial Anita Figueroa y Carmen Luisa Olivares (Las Profesoras)",
        "familia": "Comunidad Educativa Angelína",
        "ano_construccion": 1948,
        "arquitecto": "Memorial Cívico Municipal",
        "estilo_arquitectonico": "Memorial de Veneración y Devoción Popular",
        "resena_historica": "Sepultura patrimonial de las recordadas educadoras angelinas Anita Figueroa y Carmen Luisa Olivares. Sitio de constante peregrinación cívica y tradición devocional con placas de gratitud comunal.",
        "patio_id": 2,
        "latitud": -37.47315,
        "longitud": -72.32310,
        "destacado": True
    },
    {
        "nombre": "Mausoleo Familia Castro Rojas (Santiago Patricio Castro)",
        "familia": "Familia Castro Rojas",
        "ano_construccion": 1965,
        "arquitecto": "Diseño Cívico Regional",
        "estilo_arquitectonico": "Sobrio Contemporáneo en mármol y bronce",
        "resena_historica": "Lugar de descanso de Santiago Patricio Castro Rojas, notable educador y ciudadano ilustre recordado por haber diseñado la Bandera Oficial de la Comuna de Los Ángeles, aprobada por el municipio.",
        "patio_id": 3,
        "latitud": -37.47290,
        "longitud": -72.32490,
        "destacado": True
    }
]

NOMBRES = ["Carlos", "María", "José", "Rosa", "Pedro", "Ana", "Luis", "Elena", "Juan", "Carmen", "Manuel", "Teresa", "Jorge", "Lucía", "Héctor", "Marta", "Guillermo", "Patricia", "Víctor", "Gladys"]
APELLIDOS = ["González", "Muñoz", "Rojas", "Díaz", "Pérez", "Soto", "Contreras", "Silva", "Morales", "Sepúlveda", "López", "Rodríguez", "Fuentes", "Hernández", "Torres", "Araya", "Flores", "Espinoza", "Valenzuela", "Castillo"]
TIPOS = ["Individual", "Bóveda Familiar", "Nicho Perpetuo", "Mausoleo Familiar"]
ESTADOS = ["Ocupada", "Ocupada", "Disponible", "Disponible", "En Mantenimiento"]

def generate_sql():
    sql = ["-- Poblamiento oficial de Patios, Sepulturas y Mausoleos Históricos", "BEGIN;"]

    # 1. Limpiar datos existentes
    sql.append("TRUNCATE TABLE sepulturas, mausoleos_historicos, patios RESTART IDENTITY CASCADE;")

    # 2. Insertar Patios
    for p in PATIOS:
        geom = json.dumps({"type": "Polygon", "coordinates": [p["coords"]]})
        desc = p['descripcion'].replace("'", "''")
        nom = p['nombre'].replace("'", "''")
        sql.append(f"""
INSERT INTO patios (id, numero, nombre, descripcion, superficie_m2, color_hex, geom_geojson, created_at)
VALUES ({p['id']}, {p['numero']}, '{nom}', '{desc}', {p['superficie_m2']}, '{p['color_hex']}', '{geom}', NOW());
""")

    # 3. Insertar Mausoleos Históricos
    for idx, m in enumerate(MAUSOLEOS, start=1):
        geom = json.dumps({"type": "Point", "coordinates": [m["longitud"], m["latitud"]]})
        nom = m['nombre'].replace("'", "''")
        fam = m['familia'].replace("'", "''")
        arq = m['arquitecto'].replace("'", "''")
        est = m['estilo_arquitectonico'].replace("'", "''")
        res = m['resena_historica'].replace("'", "''")
        foto = f"/images/mausoleos/mausoleo_{idx}.jpg"
        sql.append(f"""
INSERT INTO mausoleos_historicos (id, nombre, familia, ano_construccion, arquitecto, estilo_arquitectonico, resena_historica, patio_id, latitud, longitud, geom_geojson, foto_url, destacado, created_at)
VALUES ({idx}, '{nom}', '{fam}', {m['ano_construccion']}, '{arq}', '{est}', '{res}', {m['patio_id']}, {m['latitud']}, {m['longitud']}, '{geom}', '{foto}', {str(m['destacado']).lower()}, NOW());
""")

    # 4. Insertar Sepulturas (10 por patio = 50 sepulturas distribuidas)
    sep_id = 1
    random.seed(42) # Semilla fija para reproducibilidad exacta

    for p in PATIOS:
        b = p["bounds"]
        sector = chr(64 + p["numero"]) # Sector A, B, C, D, E

        for i in range(1, 11):
            num = f"P{p['numero']}-{sector}-{100 + i}"
            estado = ESTADOS[i % len(ESTADOS)]
            tipo = TIPOS[i % len(TIPOS)]

            # Calcular coordenadas distribuidas dentro del patio
            lat_step = (b["max_lat"] - b["min_lat"]) / 6
            lon_step = (b["max_lon"] - b["min_lon"]) / 6
            row = (i - 1) // 3 + 1
            col = (i - 1) % 3 + 1
            lat = round(b["min_lat"] + row * lat_step + random.uniform(-0.00005, 0.00005), 6)
            lon = round(b["min_lon"] + col * lon_step + random.uniform(-0.00005, 0.00005), 6)
            geom_pt = json.dumps({"type": "Point", "coordinates": [lon, lat]})

            if estado == "Disponible":
                nom_fall = "NULL"
                ap_pat = "NULL"
                ap_mat = "NULL"
                f_nac = "NULL"
                f_fall = "NULL"
                obs = "'Sepultura disponible para asignación municipal.'"
            else:
                nom = random.choice(NOMBRES)
                pat = random.choice(APELLIDOS)
                mat = random.choice(APELLIDOS)
                nom_fall = f"'{nom}'"
                ap_pat = f"'{pat}'"
                ap_mat = f"'{mat}'"
                birth_year = random.randint(1920, 1980)
                death_year = random.randint(birth_year + 20, 2023)
                f_nac = f"'{birth_year}-05-12'"
                f_fall = f"'{death_year}-10-24'"
                obs = f"'Inhumación registrada en Libro Catastral Folio {random.randint(100, 900)}.'"

            ub_det = f"'Fila {row}, Lote {col}, Sector {sector}'"

            sql.append(f"""
INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES ({sep_id}, '{num}', {p['id']}, '{sector}', '{tipo}', '{estado}', {nom_fall}, {ap_pat}, {ap_mat}, {f_nac}, {f_fall}, {obs}, {ub_det}, {lat}, {lon}, '{geom_pt}', false, NOW(), NOW());
""")
            sep_id += 1

    sql.append("COMMIT;")
    return "\n".join(sql)

if __name__ == "__main__":
    sql_content = generate_sql()
    out_path = os.path.join(os.path.dirname(__file__), "cemetery_seed.sql")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(sql_content)
    print(f"[OK] Archivo SQL generado exitosamente en {out_path}")


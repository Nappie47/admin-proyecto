-- Poblamiento oficial de Patios, Sepulturas y Mausoleos Históricos
BEGIN;
TRUNCATE TABLE sepulturas, mausoleos_historicos, patios RESTART IDENTITY CASCADE;

INSERT INTO patios (id, numero, nombre, descripcion, superficie_m2, color_hex, geom_geojson, created_at)
VALUES (1, 1, 'Patio de los Inmigrantes y Fundadores', 'Sector fundacional de 1850 donado por la familia Robles. Alberga el histórico Patio de Disidentes y las tumbas de los colonos europeos de la Colonia Humán.', 2850.0, '#2d6a4f', '{"type": "Polygon", "coordinates": [[[-72.3235, -37.4722], [-72.3214, -37.4722], [-72.3214, -37.4734], [-72.3235, -37.4734], [-72.3235, -37.4722]]]}', NOW());


INSERT INTO patios (id, numero, nombre, descripcion, superficie_m2, color_hex, geom_geojson, created_at)
VALUES (2, 2, 'Patio Los Cipreses (Avenida Patrimonial)', 'Eje central histórico del cementerio. Concentra los mausoleos de mayor valor arquitectónico, neoclásicos y mutualistas de la provincia del Biobío.', 3200.0, '#1b4332', '{"type": "Polygon", "coordinates": [[[-72.3248, -37.4728], [-72.3226, -37.4728], [-72.3226, -37.4739], [-72.3248, -37.4739], [-72.3248, -37.4728]]]}', NOW());


INSERT INTO patios (id, numero, nombre, descripcion, superficie_m2, color_hex, geom_geojson, created_at)
VALUES (3, 3, 'Patio San José (Sector Norte)', 'Sector norponiente de sepulturas tradicionales, bóvedas de cantería y nichos perpetuos de familias angelinas tradicionales.', 2900.0, '#40916c', '{"type": "Polygon", "coordinates": [[[-72.3259, -37.4723], [-72.3237, -37.4723], [-72.3237, -37.4735], [-72.3259, -37.4735], [-72.3259, -37.4723]]]}', NOW());


INSERT INTO patios (id, numero, nombre, descripcion, superficie_m2, color_hex, geom_geojson, created_at)
VALUES (4, 4, 'Patio El Carmen (Sector Sur)', 'Sector sur tradicional de sepulturas en tierra y jardines perpetuos de la comunidad angelina.', 2750.0, '#52b788', '{"type": "Polygon", "coordinates": [[[-72.3235, -37.4735], [-72.3214, -37.4735], [-72.3214, -37.4746], [-72.3235, -37.4746], [-72.3235, -37.4735]]]}', NOW());


INSERT INTO patios (id, numero, nombre, descripcion, superficie_m2, color_hex, geom_geojson, created_at)
VALUES (5, 5, 'Patio Las Acacias (Sector Poniente)', 'Sector suroeste con parcelas familiares contemporáneas y mausoleos modernos de la segunda mitad del siglo XX.', 2800.0, '#74c69d', '{"type": "Polygon", "coordinates": [[[-72.3258, -37.4736], [-72.3236, -37.4736], [-72.3236, -37.4746], [-72.3258, -37.4746], [-72.3258, -37.4736]]]}', NOW());


INSERT INTO mausoleos_historicos (id, nombre, familia, ano_construccion, arquitecto, estilo_arquitectonico, resena_historica, patio_id, latitud, longitud, geom_geojson, destacado, created_at)
VALUES (1, 'Mausoleo Familia de la Maza y Riquelme', 'Familia de la Maza', 1885, 'Taller de Cantería y Mármol del Biobío', 'Neoclásico Republicano con ornamentación floral', 'Monumento de gran altura y valor histórico donde descansan descendientes directos vinculados a Clorinda Riquelme de la Barrera del Río (prima hermana del Libertador Bernardo O''Higgins) y propietarios del histórico fundo Paillihue.', 1, -37.47275, -72.3223, '{"type": "Point", "coordinates": [-72.3223, -37.47275]}', true, NOW());


INSERT INTO mausoleos_historicos (id, nombre, familia, ano_construccion, arquitecto, estilo_arquitectonico, resena_historica, patio_id, latitud, longitud, geom_geojson, destacado, created_at)
VALUES (2, 'Mausoleo Fundacional Familia Robles', 'Familia Robles', 1860, 'Constructor José Tomás Robles', 'Clásico en piedra sillar y columnas dóricas', 'Panteón de la familia benefactora que en 1850 donó los terrenos fundacionales para la creación del camposanto laico y público de Los Ángeles, dando inicio formal a la administración municipal del recinto.', 1, -37.4725, -72.3227, '{"type": "Point", "coordinates": [-72.3227, -37.4725]}', true, NOW());


INSERT INTO mausoleos_historicos (id, nombre, familia, ano_construccion, arquitecto, estilo_arquitectonico, resena_historica, patio_id, latitud, longitud, geom_geojson, destacado, created_at)
VALUES (3, 'Mausoleo Colonos de Humán e Inmigrantes Europeos', 'Comunidad de Inmigrantes y Disidentes', 1872, 'Colonos Constructores de Humán', 'Neogótico Germánico en granito', 'Ubicado en el acceso del camposanto. Alberga los restos de los primeros colonos alemanes, suizos y austrohúngaros establecidos en la Colonia Humán a mediados del siglo XIX, hito fundacional de la provincia.', 1, -37.4731, -72.3218, '{"type": "Point", "coordinates": [-72.3218, -37.4731]}', true, NOW());


INSERT INTO mausoleos_historicos (id, nombre, familia, ano_construccion, arquitecto, estilo_arquitectonico, resena_historica, patio_id, latitud, longitud, geom_geojson, destacado, created_at)
VALUES (4, 'Mausoleo Sociedad de Socorros Mutuos de Artesanos', 'Sociedad de Artesanos de Los Ángeles', 1912, 'Gremio de Albañilería y Mutualistas de Los Ángeles', 'Neoclásico Cívico Institucional', 'Panteón social erigido por la mutual obrera y artesana fundada a fines del siglo XIX. Representa el espíritu de solidaridad gremial y las raíces del mutualismo en la ciudad de Los Ángeles.', 2, -37.4733, -72.3235, '{"type": "Point", "coordinates": [-72.3235, -37.4733]}', true, NOW());


INSERT INTO mausoleos_historicos (id, nombre, familia, ano_construccion, arquitecto, estilo_arquitectonico, resena_historica, patio_id, latitud, longitud, geom_geojson, destacado, created_at)
VALUES (5, 'Mausoleo Familia Rioseco y Bunster', 'Familia Rioseco Bunster', 1898, 'Estudio Arquitectura Concepción-Los Ángeles', 'Historicista Ecléctico con bóveda de medio punto', 'Panteón de una de las familias precursoras de la agricultura moderna, la industria molinera y la llegada del ferrocarril a la cuenca del Biobío durante el auge cerealero del siglo XIX.', 2, -37.47355, -72.3241, '{"type": "Point", "coordinates": [-72.3241, -37.47355]}', true, NOW());


INSERT INTO mausoleos_historicos (id, nombre, familia, ano_construccion, arquitecto, estilo_arquitectonico, resena_historica, patio_id, latitud, longitud, geom_geojson, destacado, created_at)
VALUES (6, 'Panteón Memorial Anita Figueroa y Carmen Luisa Olivares (Las Profesoras)', 'Comunidad Educativa Angelína', 1948, 'Memorial Cívico Municipal', 'Memorial de Veneración y Devoción Popular', 'Sepultura patrimonial de las recordadas educadoras angelinas Anita Figueroa y Carmen Luisa Olivares. Sitio de constante peregrinación cívica y tradición devocional con placas de gratitud comunal.', 2, -37.47315, -72.3231, '{"type": "Point", "coordinates": [-72.3231, -37.47315]}', true, NOW());


INSERT INTO mausoleos_historicos (id, nombre, familia, ano_construccion, arquitecto, estilo_arquitectonico, resena_historica, patio_id, latitud, longitud, geom_geojson, destacado, created_at)
VALUES (7, 'Mausoleo Familia Castro Rojas (Santiago Patricio Castro)', 'Familia Castro Rojas', 1965, 'Diseño Cívico Regional', 'Sobrio Contemporáneo en mármol y bronce', 'Lugar de descanso de Santiago Patricio Castro Rojas, notable educador y ciudadano ilustre recordado por haber diseñado la Bandera Oficial de la Comuna de Los Ángeles, aprobada por el municipio.', 3, -37.4729, -72.3249, '{"type": "Point", "coordinates": [-72.3249, -37.4729]}', true, NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (1, 'P1-A-101', 1, 'A', 'Bóveda Familiar', 'Ocupada', 'Juan', 'Silva', 'Silva', '1928-05-12', '1961-10-24', 'Inhumación registrada en Libro Catastral Folio 792.', 'Fila 1, Lote 1, Sector A', -37.473186, -72.323197, '{"type": "Point", "coordinates": [-72.323197, -37.473186]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (2, 'P1-A-102', 1, 'A', 'Nicho Perpetuo', 'Disponible', NULL, NULL, NULL, NULL, NULL, 'Sepultura disponible para asignación municipal.', 'Fila 1, Lote 2, Sector A', -37.473176, -72.322795, '{"type": "Point", "coordinates": [-72.322795, -37.473176]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (3, 'P1-A-103', 1, 'A', 'Mausoleo Familiar', 'Disponible', NULL, NULL, NULL, NULL, NULL, 'Sepultura disponible para asignación municipal.', 'Fila 1, Lote 3, Sector A', -37.473191, -72.322497, '{"type": "Point", "coordinates": [-72.322497, -37.473191]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (4, 'P1-A-104', 1, 'A', 'Individual', 'En Mantenimiento', 'Gladys', 'González', 'Espinoza', '1932-05-12', '2021-10-24', 'Inhumación registrada en Libro Catastral Folio 529.', 'Fila 2, Lote 1, Sector A', -37.473041, -72.323177, '{"type": "Point", "coordinates": [-72.323177, -37.473041]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (5, 'P1-A-105', 1, 'A', 'Bóveda Familiar', 'Ocupada', 'Carlos', 'Soto', 'Hernández', '1941-05-12', '1978-10-24', 'Inhumación registrada en Libro Catastral Folio 259.', 'Fila 2, Lote 2, Sector A', -37.473028, -72.322791, '{"type": "Point", "coordinates": [-72.322791, -37.473028]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (6, 'P1-A-106', 1, 'A', 'Nicho Perpetuo', 'Ocupada', 'Rosa', 'Rojas', 'Fuentes', '1926-05-12', '1991-10-24', 'Inhumación registrada en Libro Catastral Folio 452.', 'Fila 2, Lote 3, Sector A', -37.473028, -72.322424, '{"type": "Point", "coordinates": [-72.322424, -37.473028]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (7, 'P1-A-107', 1, 'A', 'Mausoleo Familiar', 'Disponible', NULL, NULL, NULL, NULL, NULL, 'Sepultura disponible para asignación municipal.', 'Fila 3, Lote 1, Sector A', -37.47279, -72.323119, '{"type": "Point", "coordinates": [-72.323119, -37.47279]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (8, 'P1-A-108', 1, 'A', 'Individual', 'Disponible', NULL, NULL, NULL, NULL, NULL, 'Sepultura disponible para asignación municipal.', 'Fila 3, Lote 2, Sector A', -37.472777, -72.322796, '{"type": "Point", "coordinates": [-72.322796, -37.472777]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (9, 'P1-A-109', 1, 'A', 'Bóveda Familiar', 'En Mantenimiento', 'Patricia', 'Sepúlveda', 'Castillo', '1976-05-12', '2023-10-24', 'Inhumación registrada en Libro Catastral Folio 470.', 'Fila 3, Lote 3, Sector A', -37.472753, -72.322462, '{"type": "Point", "coordinates": [-72.322462, -37.472753]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (10, 'P1-A-110', 1, 'A', 'Nicho Perpetuo', 'Ocupada', 'María', 'Silva', 'Sepúlveda', '1925-05-12', '1974-10-24', 'Inhumación registrada en Libro Catastral Folio 203.', 'Fila 4, Lote 1, Sector A', -37.472592, -72.32313, '{"type": "Point", "coordinates": [-72.32313, -37.472592]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (11, 'P2-B-101', 2, 'B', 'Bóveda Familiar', 'Ocupada', 'Teresa', 'Soto', 'Rodríguez', '1942-05-12', '1975-10-24', 'Inhumación registrada en Libro Catastral Folio 786.', 'Fila 1, Lote 1, Sector B', -37.473729, -72.324438, '{"type": "Point", "coordinates": [-72.324438, -37.473729]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (12, 'P2-B-102', 2, 'B', 'Nicho Perpetuo', 'Disponible', NULL, NULL, NULL, NULL, NULL, 'Sepultura disponible para asignación municipal.', 'Fila 1, Lote 2, Sector B', -37.47374, -72.324023, '{"type": "Point", "coordinates": [-72.324023, -37.47374]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (13, 'P2-B-103', 2, 'B', 'Mausoleo Familiar', 'Disponible', NULL, NULL, NULL, NULL, NULL, 'Sepultura disponible para asignación municipal.', 'Fila 1, Lote 3, Sector B', -37.473702, -72.323689, '{"type": "Point", "coordinates": [-72.323689, -37.473702]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (14, 'P2-B-104', 2, 'B', 'Individual', 'En Mantenimiento', 'Ana', 'Torres', 'Fuentes', '1937-05-12', '1985-10-24', 'Inhumación registrada en Libro Catastral Folio 801.', 'Fila 2, Lote 1, Sector B', -37.473566, -72.32441, '{"type": "Point", "coordinates": [-72.32441, -37.473566]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (15, 'P2-B-105', 2, 'B', 'Bóveda Familiar', 'Ocupada', 'María', 'Silva', 'Muñoz', '1971-05-12', '2011-10-24', 'Inhumación registrada en Libro Catastral Folio 510.', 'Fila 2, Lote 2, Sector B', -37.473551, -72.32404, '{"type": "Point", "coordinates": [-72.32404, -37.473551]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (16, 'P2-B-106', 2, 'B', 'Nicho Perpetuo', 'Ocupada', 'Víctor', 'López', 'Contreras', '1961-05-12', '2012-10-24', 'Inhumación registrada en Libro Catastral Folio 505.', 'Fila 2, Lote 3, Sector B', -37.473557, -72.323729, '{"type": "Point", "coordinates": [-72.323729, -37.473557]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (17, 'P2-B-107', 2, 'B', 'Mausoleo Familiar', 'Disponible', NULL, NULL, NULL, NULL, NULL, 'Sepultura disponible para asignación municipal.', 'Fila 3, Lote 1, Sector B', -37.473312, -72.324419, '{"type": "Point", "coordinates": [-72.324419, -37.473312]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (18, 'P2-B-108', 2, 'B', 'Individual', 'Disponible', NULL, NULL, NULL, NULL, NULL, 'Sepultura disponible para asignación municipal.', 'Fila 3, Lote 2, Sector B', -37.473386, -72.324103, '{"type": "Point", "coordinates": [-72.324103, -37.473386]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (19, 'P2-B-109', 2, 'B', 'Bóveda Familiar', 'En Mantenimiento', 'Víctor', 'Hernández', 'Valenzuela', '1945-05-12', '1988-10-24', 'Inhumación registrada en Libro Catastral Folio 324.', 'Fila 3, Lote 3, Sector B', -37.473326, -72.323696, '{"type": "Point", "coordinates": [-72.323696, -37.473326]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (20, 'P2-B-110', 2, 'B', 'Nicho Perpetuo', 'Ocupada', 'Marta', 'Rojas', 'Muñoz', '1975-05-12', '1998-10-24', 'Inhumación registrada en Libro Catastral Folio 256.', 'Fila 4, Lote 1, Sector B', -37.473117, -72.32447, '{"type": "Point", "coordinates": [-72.32447, -37.473117]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (21, 'P3-C-101', 3, 'C', 'Bóveda Familiar', 'Ocupada', 'Lucía', 'Castillo', 'Rojas', '1944-05-12', '1988-10-24', 'Inhumación registrada en Libro Catastral Folio 710.', 'Fila 1, Lote 1, Sector C', -37.473287, -72.325504, '{"type": "Point", "coordinates": [-72.325504, -37.473287]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (22, 'P3-C-102', 3, 'C', 'Nicho Perpetuo', 'Disponible', NULL, NULL, NULL, NULL, NULL, 'Sepultura disponible para asignación municipal.', 'Fila 1, Lote 2, Sector C', -37.47325, -72.325164, '{"type": "Point", "coordinates": [-72.325164, -37.47325]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (23, 'P3-C-103', 3, 'C', 'Mausoleo Familiar', 'Disponible', NULL, NULL, NULL, NULL, NULL, 'Sepultura disponible para asignación municipal.', 'Fila 1, Lote 3, Sector C', -37.473253, -72.324764, '{"type": "Point", "coordinates": [-72.324764, -37.473253]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (24, 'P3-C-104', 3, 'C', 'Individual', 'En Mantenimiento', 'Patricia', 'Morales', 'López', '1927-05-12', '1984-10-24', 'Inhumación registrada en Libro Catastral Folio 545.', 'Fila 2, Lote 1, Sector C', -37.473149, -72.325511, '{"type": "Point", "coordinates": [-72.325511, -37.473149]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (25, 'P3-C-105', 3, 'C', 'Bóveda Familiar', 'Ocupada', 'Juan', 'Flores', 'Soto', '1952-05-12', '1978-10-24', 'Inhumación registrada en Libro Catastral Folio 740.', 'Fila 2, Lote 2, Sector C', -37.473134, -72.325216, '{"type": "Point", "coordinates": [-72.325216, -37.473134]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (26, 'P3-C-106', 3, 'C', 'Nicho Perpetuo', 'Ocupada', 'Gladys', 'Contreras', 'Pérez', '1943-05-12', '2011-10-24', 'Inhumación registrada en Libro Catastral Folio 265.', 'Fila 2, Lote 3, Sector C', -37.47312, -72.324786, '{"type": "Point", "coordinates": [-72.324786, -37.47312]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (27, 'P3-C-107', 3, 'C', 'Mausoleo Familiar', 'Disponible', NULL, NULL, NULL, NULL, NULL, 'Sepultura disponible para asignación municipal.', 'Fila 3, Lote 1, Sector C', -37.472896, -72.325505, '{"type": "Point", "coordinates": [-72.325505, -37.472896]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (28, 'P3-C-108', 3, 'C', 'Individual', 'Disponible', NULL, NULL, NULL, NULL, NULL, 'Sepultura disponible para asignación municipal.', 'Fila 3, Lote 2, Sector C', -37.472897, -72.325217, '{"type": "Point", "coordinates": [-72.325217, -37.472897]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (29, 'P3-C-109', 3, 'C', 'Bóveda Familiar', 'En Mantenimiento', 'Teresa', 'Sepúlveda', 'Silva', '1923-05-12', '1973-10-24', 'Inhumación registrada en Libro Catastral Folio 680.', 'Fila 3, Lote 3, Sector C', -37.472918, -72.324848, '{"type": "Point", "coordinates": [-72.324848, -37.472918]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (30, 'P3-C-110', 3, 'C', 'Nicho Perpetuo', 'Ocupada', 'Marta', 'Rojas', 'Espinoza', '1969-05-12', '1997-10-24', 'Inhumación registrada en Libro Catastral Folio 231.', 'Fila 4, Lote 1, Sector C', -37.472655, -72.325575, '{"type": "Point", "coordinates": [-72.325575, -37.472655]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (31, 'P4-D-101', 4, 'D', 'Bóveda Familiar', 'Ocupada', 'Ana', 'Morales', 'Flores', '1975-05-12', '2014-10-24', 'Inhumación registrada en Libro Catastral Folio 533.', 'Fila 1, Lote 1, Sector D', -37.474401, -72.323105, '{"type": "Point", "coordinates": [-72.323105, -37.474401]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (32, 'P4-D-102', 4, 'D', 'Nicho Perpetuo', 'Disponible', NULL, NULL, NULL, NULL, NULL, 'Sepultura disponible para asignación municipal.', 'Fila 1, Lote 2, Sector D', -37.47437, -72.322757, '{"type": "Point", "coordinates": [-72.322757, -37.47437]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (33, 'P4-D-103', 4, 'D', 'Mausoleo Familiar', 'Disponible', NULL, NULL, NULL, NULL, NULL, 'Sepultura disponible para asignación municipal.', 'Fila 1, Lote 3, Sector D', -37.474391, -72.322431, '{"type": "Point", "coordinates": [-72.322431, -37.474391]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (34, 'P4-D-104', 4, 'D', 'Individual', 'En Mantenimiento', 'Teresa', 'Torres', 'Flores', '1948-05-12', '1975-10-24', 'Inhumación registrada en Libro Catastral Folio 353.', 'Fila 2, Lote 1, Sector D', -37.474212, -72.32316, '{"type": "Point", "coordinates": [-72.32316, -37.474212]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (35, 'P4-D-105', 4, 'D', 'Bóveda Familiar', 'Ocupada', 'Víctor', 'Espinoza', 'Silva', '1957-05-12', '1991-10-24', 'Inhumación registrada en Libro Catastral Folio 107.', 'Fila 2, Lote 2, Sector D', -37.474261, -72.322816, '{"type": "Point", "coordinates": [-72.322816, -37.474261]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (36, 'P4-D-106', 4, 'D', 'Nicho Perpetuo', 'Ocupada', 'Elena', 'Rojas', 'Muñoz', '1975-05-12', '2005-10-24', 'Inhumación registrada en Libro Catastral Folio 172.', 'Fila 2, Lote 3, Sector D', -37.474276, -72.322437, '{"type": "Point", "coordinates": [-72.322437, -37.474276]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (37, 'P4-D-107', 4, 'D', 'Mausoleo Familiar', 'Disponible', NULL, NULL, NULL, NULL, NULL, 'Sepultura disponible para asignación municipal.', 'Fila 3, Lote 1, Sector D', -37.474049, -72.323172, '{"type": "Point", "coordinates": [-72.323172, -37.474049]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (38, 'P4-D-108', 4, 'D', 'Individual', 'Disponible', NULL, NULL, NULL, NULL, NULL, 'Sepultura disponible para asignación municipal.', 'Fila 3, Lote 2, Sector D', -37.474051, -72.322796, '{"type": "Point", "coordinates": [-72.322796, -37.474051]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (39, 'P4-D-109', 4, 'D', 'Bóveda Familiar', 'En Mantenimiento', 'Víctor', 'Araya', 'Silva', '1970-05-12', '2020-10-24', 'Inhumación registrada en Libro Catastral Folio 516.', 'Fila 3, Lote 3, Sector D', -37.474028, -72.322412, '{"type": "Point", "coordinates": [-72.322412, -37.474028]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (40, 'P4-D-110', 4, 'D', 'Nicho Perpetuo', 'Ocupada', 'Lucía', 'Rodríguez', 'Hernández', '1946-05-12', '1995-10-24', 'Inhumación registrada en Libro Catastral Folio 846.', 'Fila 4, Lote 1, Sector D', -37.473898, -72.32319, '{"type": "Point", "coordinates": [-72.32319, -37.473898]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (41, 'P5-E-101', 5, 'E', 'Bóveda Familiar', 'Ocupada', 'Rosa', 'Muñoz', 'Fuentes', '1966-05-12', '2007-10-24', 'Inhumación registrada en Libro Catastral Folio 211.', 'Fila 1, Lote 1, Sector E', -37.474478, -72.325418, '{"type": "Point", "coordinates": [-72.325418, -37.474478]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (42, 'P5-E-102', 5, 'E', 'Nicho Perpetuo', 'Disponible', NULL, NULL, NULL, NULL, NULL, 'Sepultura disponible para asignación municipal.', 'Fila 1, Lote 2, Sector E', -37.474458, -72.325098, '{"type": "Point", "coordinates": [-72.325098, -37.474458]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (43, 'P5-E-103', 5, 'E', 'Mausoleo Familiar', 'Disponible', NULL, NULL, NULL, NULL, NULL, 'Sepultura disponible para asignación municipal.', 'Fila 1, Lote 3, Sector E', -37.474438, -72.324708, '{"type": "Point", "coordinates": [-72.324708, -37.474438]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (44, 'P5-E-104', 5, 'E', 'Individual', 'En Mantenimiento', 'José', 'Torres', 'Espinoza', '1926-05-12', '1952-10-24', 'Inhumación registrada en Libro Catastral Folio 767.', 'Fila 2, Lote 1, Sector E', -37.474289, -72.325458, '{"type": "Point", "coordinates": [-72.325458, -37.474289]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (45, 'P5-E-105', 5, 'E', 'Bóveda Familiar', 'Ocupada', 'José', 'Silva', 'Soto', '1946-05-12', '1997-10-24', 'Inhumación registrada en Libro Catastral Folio 592.', 'Fila 2, Lote 2, Sector E', -37.474217, -72.325033, '{"type": "Point", "coordinates": [-72.325033, -37.474217]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (46, 'P5-E-106', 5, 'E', 'Nicho Perpetuo', 'Ocupada', 'María', 'Soto', 'Fuentes', '1920-05-12', '1989-10-24', 'Inhumación registrada en Libro Catastral Folio 371.', 'Fila 2, Lote 3, Sector E', -37.474295, -72.32471, '{"type": "Point", "coordinates": [-72.32471, -37.474295]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (47, 'P5-E-107', 5, 'E', 'Mausoleo Familiar', 'Disponible', NULL, NULL, NULL, NULL, NULL, 'Sepultura disponible para asignación municipal.', 'Fila 3, Lote 1, Sector E', -37.474057, -72.325405, '{"type": "Point", "coordinates": [-72.325405, -37.474057]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (48, 'P5-E-108', 5, 'E', 'Individual', 'Disponible', NULL, NULL, NULL, NULL, NULL, 'Sepultura disponible para asignación municipal.', 'Fila 3, Lote 2, Sector E', -37.474121, -72.325047, '{"type": "Point", "coordinates": [-72.325047, -37.474121]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (49, 'P5-E-109', 5, 'E', 'Bóveda Familiar', 'En Mantenimiento', 'Marta', 'Pérez', 'Contreras', '1938-05-12', '1985-10-24', 'Inhumación registrada en Libro Catastral Folio 159.', 'Fila 3, Lote 3, Sector E', -37.474077, -72.324672, '{"type": "Point", "coordinates": [-72.324672, -37.474077]}', false, NOW(), NOW());


INSERT INTO sepulturas (id, numero, patio_id, sector, tipo, estado, nombre_fallecido, apellido_paterno, apellido_materno, fecha_nacimiento, fecha_fallecimiento, observaciones, ubicacion_detalle, latitud, longitud, geom_geojson, is_deleted, created_at, updated_at)
VALUES (50, 'P5-E-110', 5, 'E', 'Nicho Perpetuo', 'Ocupada', 'Manuel', 'Muñoz', 'Muñoz', '1957-05-12', '2007-10-24', 'Inhumación registrada en Libro Catastral Folio 614.', 'Fila 4, Lote 1, Sector E', -37.473925, -72.325429, '{"type": "Point", "coordinates": [-72.325429, -37.473925]}', false, NOW(), NOW());

COMMIT;
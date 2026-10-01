import pytest
from app import create_app
from extensions import db
from models.user import User
from models.patio import Patio
from models.sepultura import Sepultura
from models.mausoleo import MausoleoHistorico
from seeds.seed_data import run_seed

class TestConfig:
    TESTING = True
    SECRET_KEY = 'test-secret'
    JWT_SECRET_KEY = 'test-jwt-secret'
    APP_ENV = 'test'
    CORS_ORIGINS = ('http://localhost:5173',)
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

@pytest.fixture
def client():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        
        # Create test patio
        patio1 = Patio(numero=1, nombre="Patio 1 Test", superficie_m2=1000.0, color_hex="#1b4332", geom_geojson='{"type":"Polygon","coordinates":[[[-72.35,-37.46],[-72.34,-37.46],[-72.34,-37.47],[-72.35,-37.47],[-72.35,-37.46]]]}')
        patio2 = Patio(numero=2, nombre="Patio 2 Test", superficie_m2=1200.0, color_hex="#2d6a4f", geom_geojson='{"type":"Polygon","coordinates":[[[-72.34,-37.46],[-72.33,-37.46],[-72.33,-37.47],[-72.34,-37.47],[-72.34,-37.46]]]}')
        db.session.add_all([patio1, patio2])
        
        # Create users (RF01, RF02, RF03)
        admin = User(username="admin_test", email="admin@test.cl", nombre_completo="Admin Test", rol="administrador", activo=True)
        admin.set_password("AdminPass123!")
        
        funcionario = User(username="func_test", email="func@test.cl", nombre_completo="Funcionario Test", rol="funcionario", activo=True)
        funcionario.set_password("FuncPass123!")

        publico = User(username="publico_test", email="publico@test.cl", nombre_completo="Usuario Público Test", rol="publico", activo=True)
        publico.set_password("PublicPass123!")

        db.session.add_all([admin, funcionario, publico])
        db.session.commit()
        
        # Create a sample grave (Sepultura 104)
        sep = Sepultura(
            numero="104",
            patio_id=patio2.id,
            sector="B",
            tipo="Individual",
            estado="Ocupada",
            nombre_fallecido="Juan",
            apellido_paterno="Pérez",
            apellido_materno="González",
            latitud=-37.465,
            longitud=-72.335,
            observaciones="Nota interna de prueba"
        )
        db.session.add(sep)

        # Create a sample mausoleo (RF12)
        m = MausoleoHistorico(
            nombre="Mausoleo de la Familia Rivas",
            familia="Familia Rivas",
            ano_construccion=1933,
            resena_historica="Mausoleo patrimonial histórico emblemático.",
            latitud=-37.46815,
            longitud=-72.35330,
            destacado=True
        )
        db.session.add(m)
        db.session.commit()

        yield app.test_client()

def test_health_check(client):
    res = client.get('/api/health')
    assert res.status_code == 200
    data = res.get_json()
    assert data['status'] == 'healthy'

@pytest.mark.parametrize(
    ('secret_key', 'jwt_secret_key', 'cors_origins'),
    [
        ('short', 'jwt-secret-long-enough-for-validation-123', ('https://app.example.cl',)),
        ('app-secret-long-enough-for-validation-123', 'short', ('https://app.example.cl',)),
        ('app-secret-long-enough-for-validation-123', 'jwt-secret-long-enough-for-validation-123', ('*',)),
        ('app-secret-long-enough-for-validation-123', 'jwt-secret-long-enough-for-validation-123', ()),
        ('app-secret-long-enough-for-validation-123', 'jwt-secret-long-enough-for-validation-123', ('http://app.example.cl',))
    ]
)
def test_production_config_rejects_default_or_open_security_settings(
    secret_key,
    jwt_secret_key,
    cors_origins
):
    class ProductionConfig:
        APP_ENV = 'production'
        SECRET_KEY = secret_key
        JWT_SECRET_KEY = jwt_secret_key
        CORS_ORIGINS = cors_origins
        SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

    with pytest.raises(ValueError):
        create_app(ProductionConfig)

def test_production_config_accepts_unique_secrets_and_explicit_origins():
    class ProductionConfig:
        APP_ENV = 'production'
        SECRET_KEY = 'app-secret-long-enough-for-validation-123'
        JWT_SECRET_KEY = 'jwt-secret-long-enough-for-validation-123'
        CORS_ORIGINS = ('https://app.example.cl',)
        SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

    app = create_app(ProductionConfig)

    assert app.config['CORS_ORIGINS'] == ('https://app.example.cl',)

def test_login_success_and_jwt(client):
    """RF01: Login with username or email and password"""
    res = client.post('/api/auth/login', json={
        'username': 'admin_test',
        'password': 'AdminPass123!'
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert 'token' in data
    assert data['user']['rol'] == 'administrador'

    # Also test login with email
    res_email = client.post('/api/auth/login', json={
        'email': 'admin@test.cl',
        'password': 'AdminPass123!'
    })
    assert res_email.status_code == 200

def test_login_invalid_credentials(client):
    res = client.post('/api/auth/login', json={
        'username': 'admin_test',
        'password': 'WrongPassword'
    })
    assert res.status_code == 401

def test_public_access_sepulturas(client):
    """RF07 & RF11: Public search and consultation without login"""
    res = client.get('/api/sepulturas')
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert data['total'] >= 1
    assert any(s['numero'] == '104' for s in data['sepulturas'])
    grave = next(s for s in data['sepulturas'] if s['numero'] == '104')
    assert 'observaciones' not in grave
    detail = client.get(f"/api/sepulturas/{grave['id']}").get_json()['sepultura']
    assert 'observaciones' not in detail

def test_sepultura_observaciones_are_only_visible_to_staff(client):
    public_login = client.post('/api/auth/login', json={
        'username': 'publico_test',
        'password': 'PublicPass123!'
    })
    public_headers = {'Authorization': f"Bearer {public_login.get_json()['token']}"}
    public_list = client.get('/api/sepulturas', headers=public_headers).get_json()
    assert 'observaciones' not in public_list['sepulturas'][0]
    public_detail = client.get('/api/sepulturas/1', headers=public_headers).get_json()
    assert 'observaciones' not in public_detail['sepultura']

    staff_login = client.post('/api/auth/login', json={
        'username': 'func_test',
        'password': 'FuncPass123!'
    })
    staff_headers = {'Authorization': f"Bearer {staff_login.get_json()['token']}"}
    staff_list = client.get('/api/sepulturas', headers=staff_headers).get_json()
    assert staff_list['sepulturas'][0]['observaciones'] == 'Nota interna de prueba'
    staff_detail = client.get('/api/sepulturas/1', headers=staff_headers).get_json()
    assert staff_detail['sepultura']['observaciones'] == 'Nota interna de prueba'

def test_search_sepulturas_by_name(client):
    """RF08: Multi-criteria search"""
    res = client.get('/api/sepulturas?apellido=Pérez')
    assert res.status_code == 200
    data = res.get_json()
    assert data['total'] == 1
    assert data['sepulturas'][0]['nombre_fallecido'] == 'Juan'

def test_geojson_sepulturas_and_patios(client):
    """RF09 & RF10: Geospatial GeoJSON export for map visualization"""
    res_sep = client.get('/api/sepulturas/geojson')
    assert res_sep.status_code == 200
    geo = res_sep.get_json()
    assert geo['type'] == 'FeatureCollection'
    assert len(geo['features']) >= 1

    res_pat = client.get('/api/patios/geojson')
    assert res_pat.status_code == 200
    pat_geo = res_pat.get_json()
    assert pat_geo['type'] == 'FeatureCollection'
    assert len(pat_geo['features']) == 2

def test_patio_mutations_require_staff_role(client):
    assert client.get('/api/patios').status_code == 200

    requests = [
        ('post', '/api/patios', {'json': {'numero': 3, 'nombre': 'Patio de prueba'}}),
        ('put', '/api/patios/1', {'json': {'nombre': 'Patio modificado'}}),
        ('delete', '/api/patios/1', {}),
        ('post', '/api/patios/bootstrap', {'json': {}})
    ]

    for method, path, kwargs in requests:
        response = getattr(client, method)(path, **kwargs)
        assert response.status_code == 401

def test_public_user_cannot_mutate_patios(client):
    login_res = client.post('/api/auth/login', json={
        'username': 'publico_test',
        'password': 'PublicPass123!'
    })
    headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}

    requests = [
        ('post', '/api/patios', {'json': {'numero': 3, 'nombre': 'Patio de prueba'}}),
        ('put', '/api/patios/1', {'json': {'nombre': 'Patio modificado'}}),
        ('delete', '/api/patios/1', {}),
        ('post', '/api/patios/bootstrap', {'json': {}})
    ]

    for method, path, kwargs in requests:
        response = getattr(client, method)(path, headers=headers, **kwargs)
        assert response.status_code == 403

def test_admin_cannot_run_patio_bootstrap(client):
    login_res = client.post('/api/auth/login', json={
        'username': 'admin_test',
        'password': 'AdminPass123!'
    })
    headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}
    patios_before = client.get('/api/patios').get_json()['patios']
    sepulturas_before = client.get('/api/sepulturas').get_json()['total']

    response = client.post('/api/patios/bootstrap', headers=headers, json={})

    assert response.status_code == 410
    assert response.get_json()['success'] is False
    assert client.get('/api/patios').get_json()['patios'] == patios_before
    assert client.get('/api/sepulturas').get_json()['total'] == sepulturas_before

@pytest.mark.parametrize(
    ('username', 'password'),
    [
        ('admin_test', 'AdminPass123!'),
        ('func_test', 'FuncPass123!')
    ]
)
def test_patio_crud_authorized_for_staff(client, username, password):
    login_res = client.post('/api/auth/login', json={
        'username': username,
        'password': password
    })
    headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}

    create_res = client.post('/api/patios', headers=headers, json={
        'numero': 3,
        'nombre': 'Patio CRUD Test',
        'geom_geojson': {
            'type': 'Polygon',
            'coordinates': [[
                [-72.35, -37.46],
                [-72.34, -37.46],
                [-72.34, -37.47],
                [-72.35, -37.46]
            ]]
        }
    })
    assert create_res.status_code == 201
    patio_id = create_res.get_json()['patio']['id']

    update_res = client.put(
        f'/api/patios/{patio_id}',
        headers=headers,
        json={'nombre': 'Patio CRUD Actualizado'}
    )
    assert update_res.status_code == 200
    assert update_res.get_json()['patio']['nombre'] == 'Patio CRUD Actualizado'

    delete_res = client.delete(f'/api/patios/{patio_id}', headers=headers)
    assert delete_res.status_code == 200

@pytest.mark.parametrize(
    'geometry',
    [
        {'type': 'Point', 'coordinates': [-72.35, -37.46]},
        {'type': 'Polygon', 'coordinates': []},
        {'type': 'Polygon', 'coordinates': [[
            [-72.35, -37.46],
            [-72.34, -37.46],
            [-72.34, -37.47]
        ]]},
        {'type': 'Polygon', 'coordinates': [[
            [-181, -37.46],
            [-72.34, -37.46],
            [-72.34, -37.47],
            [-181, -37.46]
        ]]},
        {'type': 'Polygon', 'coordinates': [[
            [-72.35, -37.46],
            [-72.34, -37.47],
            [-72.35, -37.47],
            [-72.34, -37.46],
            [-72.35, -37.46]
        ]]},
        {'type': 'Polygon', 'coordinates': [[
            [-72.35, -37.46],
            [-72.34, -37.46],
            [-72.33, -37.46],
            [-72.35, -37.46]
        ]]},
        {'type': 'Polygon', 'coordinates': [[
            ['-72.35', -37.46],
            [-72.34, -37.46],
            [-72.34, -37.47],
            ['-72.35', -37.46]
        ]]}
    ]
)
def test_create_patio_rejects_invalid_geometry(client, geometry):
    login_res = client.post('/api/auth/login', json={
        'username': 'func_test',
        'password': 'FuncPass123!'
    })
    headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}

    response = client.post('/api/patios', headers=headers, json={
        'numero': 3,
        'nombre': 'Patio inválido',
        'geom_geojson': geometry
    })

    assert response.status_code == 400
    assert response.get_json()['success'] is False

def test_create_patio_requires_geometry(client):
    login_res = client.post('/api/auth/login', json={
        'username': 'func_test',
        'password': 'FuncPass123!'
    })
    headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}

    response = client.post('/api/patios', headers=headers, json={
        'numero': 3,
        'nombre': 'Patio sin geometría'
    })

    assert response.status_code == 400
    assert 'geometría' in response.get_json()['error']

@pytest.mark.parametrize(
    ('field', 'value'),
    [
        ('numero', 1.5),
        ('numero', -1),
        ('numero', 'no-numérico'),
        ('numero', True),
        ('superficie_m2', -1),
        ('superficie_m2', 'NaN'),
        ('superficie_m2', 'Infinity')
    ]
)
def test_create_patio_rejects_invalid_numeric_fields(client, field, value):
    login_res = client.post('/api/auth/login', json={
        'username': 'func_test',
        'password': 'FuncPass123!'
    })
    headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}
    payload = {
        'numero': 3,
        'nombre': 'Patio numérico inválido',
        'superficie_m2': 100,
        'geom_geojson': {
            'type': 'Polygon',
            'coordinates': [[
                [-72.35, -37.46],
                [-72.34, -37.46],
                [-72.34, -37.47],
                [-72.35, -37.46]
            ]]
        }
    }
    payload[field] = value

    response = client.post('/api/patios', headers=headers, json=payload)

    assert response.status_code == 400
    assert response.get_json()['success'] is False
    assert client.get('/api/patios/3').status_code == 404

@pytest.mark.parametrize(
    ('field', 'value'),
    [
        ('numero', 1.5),
        ('superficie_m2', 'Infinity'),
        ('superficie_m2', -1)
    ]
)
def test_update_patio_rejects_invalid_numeric_fields_without_changes(client, field, value):
    login_res = client.post('/api/auth/login', json={
        'username': 'func_test',
        'password': 'FuncPass123!'
    })
    headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}

    response = client.put(
        '/api/patios/1',
        headers=headers,
        json={'nombre': 'No debe guardarse', field: value}
    )

    assert response.status_code == 400
    patio = client.get('/api/patios/1').get_json()['patio']
    assert patio['nombre'] == 'Patio 1 Test'
    assert patio['superficie_m2'] == 1000.0

def test_update_patio_rejects_invalid_geometry_without_changes(client):
    login_res = client.post('/api/auth/login', json={
        'username': 'func_test',
        'password': 'FuncPass123!'
    })
    headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}

    response = client.put('/api/patios/1', headers=headers, json={
        'nombre': 'No debe guardarse',
        'geom_geojson': {'type': 'Polygon', 'coordinates': []}
    })

    assert response.status_code == 400
    patio = client.get('/api/patios/1').get_json()['patio']
    assert patio['nombre'] == 'Patio 1 Test'

def test_cannot_delete_patio_with_sepulturas(client):
    login_res = client.post('/api/auth/login', json={
        'username': 'admin_test',
        'password': 'AdminPass123!'
    })
    headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}

    delete_res = client.delete('/api/patios/2', headers=headers)

    assert delete_res.status_code == 409
    assert 'sepulturas asociadas' in delete_res.get_json()['error']
    assert client.get('/api/patios/2').status_code == 200
    sepulturas = client.get('/api/sepulturas?patio=2').get_json()['sepulturas']
    assert any(sepultura['numero'] == '104' for sepultura in sepulturas)

@pytest.mark.parametrize(
    ('field', 'value'),
    [
        ('latitud', 91),
        ('longitud', -181),
        ('fecha_nacimiento', '2020-02-30'),
        ('fecha_fallecimiento', 'no-es-fecha')
    ]
)
def test_create_sepultura_rejects_invalid_coordinates_and_dates(client, field, value):
    login_res = client.post('/api/auth/login', json={
        'username': 'func_test',
        'password': 'FuncPass123!'
    })
    headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}
    payload = {
        'numero': f'555-{field}',
        'patio_numero': 1,
        'sector': 'A',
        'tipo': 'Individual',
        'estado': 'Disponible',
        'latitud': -37.465,
        'longitud': -72.345,
        field: value
    }

    response = client.post('/api/sepulturas', headers=headers, json=payload)

    assert response.status_code == 400
    assert response.get_json()['success'] is False

def test_create_sepultura_requires_coordinates(client):
    login_res = client.post('/api/auth/login', json={
        'username': 'func_test',
        'password': 'FuncPass123!'
    })
    headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}

    response = client.post('/api/sepulturas', headers=headers, json={
        'numero': '555-no-location',
        'patio_numero': 1
    })

    assert response.status_code == 400
    assert 'latitud y longitud' in response.get_json()['error']

def test_update_sepultura_rejects_invalid_data_without_changes(client):
    login_res = client.post('/api/auth/login', json={
        'username': 'func_test',
        'password': 'FuncPass123!'
    })
    headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}

    response = client.put('/api/sepulturas/1', headers=headers, json={
        'apellido_paterno': 'No debe guardarse',
        'longitud': 181,
        'fecha_nacimiento': 'fecha-inválida'
    })

    assert response.status_code == 400
    unchanged = client.get('/api/sepulturas/1').get_json()['sepultura']
    assert unchanged['apellido_paterno'] == 'Pérez'
    assert unchanged['longitud'] == -72.335

def test_sepultura_location_must_be_inside_selected_patio(client):
    login_res = client.post('/api/auth/login', json={
        'username': 'func_test',
        'password': 'FuncPass123!'
    })
    headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}

    create_res = client.post('/api/sepulturas', headers=headers, json={
        'numero': '555-outside',
        'patio_numero': 1,
        'latitud': -37.465,
        'longitud': -72.355
    })
    assert create_res.status_code == 400
    assert 'dentro del polígono' in create_res.get_json()['error']

    update_res = client.put('/api/sepulturas/1', headers=headers, json={
        'longitud': -72.355
    })
    assert update_res.status_code == 400
    grave = client.get('/api/sepulturas/1', headers=headers).get_json()['sepultura']
    assert grave['longitud'] == -72.335

def test_deleted_sepulturas_are_hidden_from_public_access(client):
    login_res = client.post('/api/auth/login', json={
        'username': 'func_test',
        'password': 'FuncPass123!'
    })
    staff_headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}
    assert client.delete('/api/sepulturas/1', headers=staff_headers).status_code == 200

    assert client.get('/api/sepulturas?include_deleted=true').status_code == 401
    active_list = client.get('/api/sepulturas').get_json()['sepulturas']
    assert not any(sepultura['id'] == 1 for sepultura in active_list)
    assert client.get('/api/sepulturas/1').status_code == 404

    public_login = client.post('/api/auth/login', json={
        'username': 'publico_test',
        'password': 'PublicPass123!'
    })
    public_headers = {'Authorization': f"Bearer {public_login.get_json()['token']}"}
    assert client.get('/api/sepulturas?include_deleted=true', headers=public_headers).status_code == 403
    assert client.get('/api/sepulturas/1', headers=public_headers).status_code == 404

    staff_list = client.get('/api/sepulturas?include_deleted=true', headers=staff_headers)
    assert staff_list.status_code == 200
    assert any(sepultura['id'] == 1 for sepultura in staff_list.get_json()['sepulturas'])
    assert client.get('/api/sepulturas/1', headers=staff_headers).status_code == 200

def test_permanent_delete_is_disabled(client):
    login_res = client.post('/api/auth/login', json={
        'username': 'func_test',
        'password': 'FuncPass123!'
    })
    headers = {'Authorization': f"Bearer {login_res.get_json()['token']}"}

    response = client.delete('/api/sepulturas/1?permanent=true', headers=headers)

    assert response.status_code == 400
    assert 'deshabilitado' in response.get_json()['error']
    grave = client.get('/api/sepulturas/1', headers=headers).get_json()['sepultura']
    assert grave['is_deleted'] is False

def test_crud_sepultura_authorized(client):
    """RF04, RF05, RF06: Create, Update, Delete sepultura with JWT token"""
    # 1. Login as funcionario
    login_res = client.post('/api/auth/login', json={
        'username': 'func_test',
        'password': 'FuncPass123!'
    })
    token = login_res.get_json()['token']
    headers = {'Authorization': f'Bearer {token}'}

    # 2. Create sepultura (RF04)
    create_res = client.post('/api/sepulturas', headers=headers, json={
        'numero': '555',
        'patio_numero': 1,
        'sector': 'A',
        'tipo': 'Individual',
        'estado': 'Disponible',
        'latitud': -37.465,
        'longitud': -72.345,
        'nombre_fallecido': 'Datos',
        'apellido_paterno': 'No aplicables',
        'apellido_materno': 'No aplicables',
        'fecha_nacimiento': '1940-01-01',
        'fecha_fallecimiento': '2020-01-01'
    })
    assert create_res.status_code == 201
    sep_id = create_res.get_json()['sepultura']['id']
    assert create_res.get_json()['sepultura']['nombre_fallecido'] is None
    assert create_res.get_json()['sepultura']['fecha_nacimiento'] is None

    # 3. Update sepultura (RF05)
    update_res = client.put(f'/api/sepulturas/{sep_id}', headers=headers, json={
        'estado': 'Ocupada',
        'nombre_fallecido': 'Roberto',
        'apellido_paterno': 'Bravo',
        'fecha_nacimiento': '1940-01-01',
        'fecha_fallecimiento': '2020-01-01'
    })
    assert update_res.status_code == 200
    assert update_res.get_json()['sepultura']['nombre_fallecido'] == 'Roberto'

    available_res = client.put(f'/api/sepulturas/{sep_id}', headers=headers, json={
        'estado': 'Disponible'
    })
    assert available_res.status_code == 200
    available_sepultura = available_res.get_json()['sepultura']
    assert available_sepultura['nombre_fallecido'] is None
    assert available_sepultura['apellido_paterno'] is None
    assert available_sepultura['fecha_nacimiento'] is None
    assert available_sepultura['fecha_fallecimiento'] is None

    public_detail = client.get(f'/api/sepulturas/{sep_id}').get_json()['sepultura']
    assert public_detail['nombre_fallecido'] is None

    # 4. Deactivate sepultura (RF06)
    del_res = client.delete(f'/api/sepulturas/{sep_id}', headers=headers)
    assert del_res.status_code == 200

    # Ensure it is now hidden from default listing
    list_res = client.get(f'/api/sepulturas/{sep_id}', headers=headers)
    assert list_res.get_json()['sepultura']['is_deleted'] is True

def test_historical_mausoleums_catalog(client):
    """RF12: Catalog of historical mausoleums"""
    res = client.get('/api/mausoleos')
    assert res.status_code == 200
    data = res.get_json()
    assert data['total'] >= 1
    assert data['mausoleos'][0]['nombre'] == "Mausoleo de la Familia Rivas"

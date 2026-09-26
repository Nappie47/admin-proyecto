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
        
        db.session.add_all([admin, funcionario])
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
            latitud=-37.46825,
            longitud=-72.35175
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
        'latitud': -37.4689,
        'longitud': -72.3528
    })
    assert create_res.status_code == 201
    sep_id = create_res.get_json()['sepultura']['id']

    # 3. Update sepultura (RF05)
    update_res = client.put(f'/api/sepulturas/{sep_id}', headers=headers, json={
        'estado': 'Ocupada',
        'nombre_fallecido': 'Roberto',
        'apellido_paterno': 'Bravo'
    })
    assert update_res.status_code == 200
    assert update_res.get_json()['sepultura']['nombre_fallecido'] == 'Roberto'

    # 4. Deactivate sepultura (RF06)
    del_res = client.delete(f'/api/sepulturas/{sep_id}', headers=headers)
    assert del_res.status_code == 200

    # Ensure it is now hidden from default listing
    list_res = client.get(f'/api/sepulturas/{sep_id}')
    assert list_res.get_json()['sepultura']['is_deleted'] is True

def test_historical_mausoleums_catalog(client):
    """RF12: Catalog of historical mausoleums"""
    res = client.get('/api/mausoleos')
    assert res.status_code == 200
    data = res.get_json()
    assert data['total'] >= 1
    assert data['mausoleos'][0]['nombre'] == "Mausoleo de la Familia Rivas"

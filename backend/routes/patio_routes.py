from flask import Blueprint, jsonify
from models.patio import Patio

patio_bp = Blueprint('patios', __name__, url_prefix='/api/patios')

@patio_bp.route('', methods=['GET'])
def get_patios():
    """Lista todos los patios del Cementerio General de Los Ángeles (Patios 1 al 5)"""
    patios = Patio.query.order_by(Patio.numero.asc()).all()
    return jsonify({
        'success': True,
        'patios': [p.to_dict() for p in patios]
    }), 200

@patio_bp.route('/geojson', methods=['GET'])
def get_patios_geojson():
    """RF10: GeoJSON FeatureCollection de los 5 patios para Leaflet"""
    patios = Patio.query.order_by(Patio.numero.asc()).all()
    features = [p.to_geojson_feature() for p in patios if p.geom_geojson]
    return jsonify({
        'type': 'FeatureCollection',
        'features': features
    }), 200

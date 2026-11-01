import json
from datetime import datetime
from extensions import db

class Patio(db.Model):
    __tablename__ = 'patios'

    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.Integer, unique=True, nullable=False, index=True) # 1, 2, 3, 4, 5
    nombre = db.Column(db.String(100), nullable=False) # e.g. "Patio 1 - Acceso Histórico"
    descripcion = db.Column(db.Text, nullable=True)
    superficie_m2 = db.Column(db.Float, nullable=True)
    color_hex = db.Column(db.String(10), default='#2d6a4f')
    # Coordinates array / GeoJSON Polygon for cartographic representation (RF09, RF10)
    geom_geojson = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    sepulturas = db.relationship('Sepultura', back_populates='patio', cascade='all, delete-orphan')

    def to_dict(self):
        geom = None
        if self.geom_geojson:
            try:
                geom = json.loads(self.geom_geojson)
            except Exception:
                geom = None
        return {
            'id': self.id,
            'numero': self.numero,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'superficie_m2': self.superficie_m2,
            'color_hex': self.color_hex,
            'geometry': geom,
            'total_sepulturas': len(self.sepulturas) if self.sepulturas else 0
        }

    def to_geojson_feature(self):
        geom = None
        if self.geom_geojson:
            try:
                geom = json.loads(self.geom_geojson)
            except Exception:
                geom = None
        return {
            'type': 'Feature',
            'properties': {
                'id': self.id,
                'numero': self.numero,
                'nombre': self.nombre,
                'descripcion': self.descripcion,
                'color_hex': self.color_hex,
                'superficie_m2': self.superficie_m2,
                'total_sepulturas': len(self.sepulturas) if self.sepulturas else 0
            },
            'geometry': geom
        }

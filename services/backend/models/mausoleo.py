import json
from datetime import datetime
from extensions import db

class MausoleoHistorico(db.Model):
    __tablename__ = 'mausoleos_historicos'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(150), nullable=False) # e.g. "Mausoleo de la Familia Rivas"
    familia = db.Column(db.String(120), nullable=True) # "Familia Rivas"
    ano_construccion = db.Column(db.Integer, nullable=True) # e.g. 1933
    arquitecto = db.Column(db.String(120), nullable=True)
    estilo_arquitectonico = db.Column(db.String(100), nullable=True) # e.g. "Neoclásico", "Art Déco", "Gótico"
    resena_historica = db.Column(db.Text, nullable=False)
    foto_url = db.Column(db.String(300), nullable=True)
    patio_id = db.Column(db.Integer, db.ForeignKey('patios.id'), nullable=True)
    latitud = db.Column(db.Float, nullable=False)
    longitud = db.Column(db.Float, nullable=False)
    geom_geojson = db.Column(db.Text, nullable=True)
    destacado = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    patio = db.relationship('Patio')

    def to_dict(self):
        geom = None
        if self.geom_geojson:
            try:
                geom = json.loads(self.geom_geojson)
            except Exception:
                geom = None
        return {
            'id': self.id,
            'nombre': self.nombre,
            'familia': self.familia,
            'ano_construccion': self.ano_construccion,
            'arquitecto': self.arquitecto,
            'estilo_arquitectonico': self.estilo_arquitectonico,
            'resena_historica': self.resena_historica,
            'foto_url': self.foto_url,
            'patio_id': self.patio_id,
            'patio_numero': self.patio.numero if self.patio else None,
            'latitud': self.latitud,
            'longitud': self.longitud,
            'geometry': geom,
            'destacado': self.destacado
        }

    def to_geojson_feature(self):
        geom = None
        if self.geom_geojson:
            try:
                geom = json.loads(self.geom_geojson)
            except Exception:
                geom = None
        if not geom:
            geom = {
                'type': 'Point',
                'coordinates': [self.longitud, self.latitud]
            }

        return {
            'type': 'Feature',
            'properties': {
                'id': self.id,
                'nombre': self.nombre,
                'familia': self.familia,
                'ano_construccion': self.ano_construccion,
                'estilo_arquitectonico': self.estilo_arquitectonico,
                'resena_historica': self.resena_historica,
                'foto_url': self.foto_url,
                'destacado': self.destacado,
                'tipo': 'Mausoleo Histórico'
            },
            'geometry': geom
        }

import json
from datetime import datetime, date
from extensions import db

class Sepultura(db.Model):
    __tablename__ = 'sepulturas'

    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.String(30), nullable=False, index=True) # e.g. "104"
    patio_id = db.Column(db.Integer, db.ForeignKey('patios.id'), nullable=False, index=True)
    sector = db.Column(db.String(30), nullable=False, default='A') # "A", "B", "C", "D"
    tipo = db.Column(db.String(40), nullable=False, default='Individual') # Individual, Familiar, Mausoleo, Nicho
    estado = db.Column(db.String(30), nullable=False, default='Ocupada') # Ocupada, Disponible, En Mantenimiento
    
    # Deceased information (RF04, RF07, RF08)
    nombre_fallecido = db.Column(db.String(120), nullable=True) # e.g. "Juan"
    apellido_paterno = db.Column(db.String(120), nullable=True) # e.g. "Pérez"
    apellido_materno = db.Column(db.String(120), nullable=True)
    fecha_nacimiento = db.Column(db.Date, nullable=True)
    fecha_fallecimiento = db.Column(db.Date, nullable=True)
    
    observaciones = db.Column(db.Text, nullable=True)
    ubicacion_detalle = db.Column(db.String(150), nullable=True) # e.g. "Patio 2, Fila 4, Número 104"
    
    # Geospatial location (RF09, RF10)
    latitud = db.Column(db.Float, nullable=False) # e.g. -37.46820
    longitud = db.Column(db.Float, nullable=False) # e.g. -72.35210
    geom_geojson = db.Column(db.Text, nullable=True) # Point or small Polygon
    
    # Deactivation / Soft deletion (RF06)
    is_deleted = db.Column(db.Boolean, default=False, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patio = db.relationship('Patio', back_populates='sepulturas')

    @property
    def nombre_completo(self):
        parts = [self.nombre_fallecido or '', self.apellido_paterno or '', self.apellido_materno or '']
        full = " ".join([p.strip() for p in parts if p.strip()])
        return full if full else "Sin asignar"

    def to_dict(self, include_observaciones=True):
        geom = None
        if self.geom_geojson:
            try:
                geom = json.loads(self.geom_geojson)
            except Exception:
                geom = None
        
        data = {
            'id': self.id,
            'numero': self.numero,
            'patio_id': self.patio_id,
            'patio_numero': self.patio.numero if self.patio else None,
            'patio_nombre': self.patio.nombre if self.patio else None,
            'sector': self.sector,
            'tipo': self.tipo,
            'estado': self.estado,
            'nombre_fallecido': self.nombre_fallecido,
            'apellido_paterno': self.apellido_paterno,
            'apellido_materno': self.apellido_materno,
            'nombre_completo': self.nombre_completo,
            'fecha_nacimiento': self.fecha_nacimiento.strftime('%Y-%m-%d') if self.fecha_nacimiento else None,
            'fecha_fallecimiento': self.fecha_fallecimiento.strftime('%Y-%m-%d') if self.fecha_fallecimiento else None,
            'ubicacion_detalle': self.ubicacion_detalle or f"Patio {self.patio.numero if self.patio else 'N/A'}, Sector {self.sector}, Número {self.numero}",
            'latitud': self.latitud,
            'longitud': self.longitud,
            'geometry': geom,
            'is_deleted': self.is_deleted,
            'created_at': self.created_at.strftime('%Y-%m-%d') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d') if self.updated_at else None
        }
        if include_observaciones:
            data['observaciones'] = self.observaciones
        return data

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
                'numero': self.numero,
                'patio_numero': self.patio.numero if self.patio else None,
                'patio_nombre': self.patio.nombre if self.patio else None,
                'sector': self.sector,
                'tipo': self.tipo,
                'estado': self.estado,
                'nombre_completo': self.nombre_completo,
                'fecha_fallecimiento': self.fecha_fallecimiento.strftime('%Y-%m-%d') if self.fecha_fallecimiento else None,
                'ubicacion_detalle': self.ubicacion_detalle or f"Patio {self.patio.numero if self.patio else 'N/A'}, Sector {self.sector}, Número {self.numero}",
                'latitud': self.latitud,
                'longitud': self.longitud
            },
            'geometry': geom
        }

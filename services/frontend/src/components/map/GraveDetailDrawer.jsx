import React from 'react';
import { X, MapPin, Eye } from 'lucide-react';

export const GraveDetailDrawer = ({
  grave,
  onClose,
  onCenterOnMap,
  onViewDetails
}) => {
  if (!grave) return null;

  return (
    <div className="map-drawer-panel">
      {/* Drawer Header */}
      <div className="map-drawer-header" style={{ padding: '1.25rem', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f2d1e', margin: 0 }}>
            Sepultura {grave.numero}
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Patio {grave.patio_numero} • Sector {grave.sector}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="map-drawer-body">
        {/* Photo */}
        <div style={{ height: '140px', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem', backgroundColor: '#f1f5f9' }}>
          <img
            src={grave.foto_url || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80"}
            alt="Sepultura"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Data Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
            <span style={{ color: '#64748b' }}>Número</span>
            <span style={{ fontWeight: '600' }}>{grave.numero}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
            <span style={{ color: '#64748b' }}>Tipo</span>
            <span style={{ fontWeight: '600' }}>{grave.tipo}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
            <span style={{ color: '#64748b' }}>Estado</span>
            <span className={`badge-status ${grave.estado.toLowerCase().replace(' ', '-')}`}>
              {grave.estado}
            </span>
          </div>
          {grave.nombre_completo && (
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
              <span style={{ color: '#64748b' }}>Nombre</span>
              <span style={{ fontWeight: '700', color: '#1b4332' }}>{grave.nombre_completo}</span>
            </div>
          )}
          {grave.fecha_fallecimiento && (
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
              <span style={{ color: '#64748b' }}>Fecha de fallecimiento</span>
              <span style={{ fontWeight: '600' }}>{grave.fecha_fallecimiento}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
            <span style={{ color: '#64748b' }}>Ubicación</span>
            <span style={{ fontWeight: '600' }}>{grave.ubicacion_detalle || `Patio ${grave.patio_numero}`}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
            <span style={{ color: '#64748b' }}>Coordenadas</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#475569' }}>
              {grave.latitud?.toFixed(5)}, {grave.longitud?.toFixed(5)}
            </span>
          </div>
        </div>

        {grave.observaciones && (
          <div style={{ marginTop: '1rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', fontSize: '0.78rem', color: '#475569', lineHeight: '1.4' }}>
            <strong>Observaciones:</strong> {grave.observaciones}
          </div>
        )}
      </div>

      {/* Drawer Actions */}
      <div className="map-drawer-footer">
        <button
          onClick={onCenterOnMap}
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
        >
          <MapPin size={15} color="#2d6a4f" />
          Centrar en el mapa
        </button>
        {!grave.isMausoleo && onViewDetails && (
          <button
            onClick={onViewDetails}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
          >
            <Eye size={15} />
            Ver más información
          </button>
        )}
      </div>
    </div>
  );
};


import React from 'react';

export const MapLegend = () => {
  return (
    <div className="map-legend-box">
      <div className="map-legend-title">
        Leyenda SIG
      </div>
      <div className="map-legend-list">
        <div className="map-legend-item">
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2563eb', border: '1px solid white' }} />
          <span>Seleccionada</span>
        </div>
        <div className="map-legend-item">
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
          <span>Disponible</span>
        </div>
        <div className="map-legend-item">
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2d6a4f' }} />
          <span>Ocupada</span>
        </div>
        <div className="map-legend-item">
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#b45309' }} />
          <span>Mausoleo histórico</span>
        </div>
        <div className="map-legend-item">
          <div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(45, 106, 79, 0.25)', border: '1px dashed #2d6a4f' }} />
          <span>Límite de patio</span>
        </div>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { Layers, ChevronUp, ChevronDown, X } from 'lucide-react';

export const MapLegend = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`map-legend-box ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Mobile Toggle Bar / Header */}
      <button 
        type="button"
        className="map-legend-header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={isExpanded ? 'Contraer leyenda' : 'Expandir leyenda'}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={14} color="#2d6a4f" />
          <span className="map-legend-title">Leyenda SIG</span>
        </span>
        <span className="map-legend-toggle-icon">
          {isExpanded ? <X size={14} /> : <ChevronUp size={14} />}
        </span>
      </button>

      {/* Legend Content */}
      <div className="map-legend-list">
        <div className="map-legend-item">
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2563eb', border: '1px solid white', flexShrink: 0 }} />
          <span>Seleccionada</span>
        </div>
        <div className="map-legend-item">
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0284c7', flexShrink: 0 }} />
          <span>Disponible</span>
        </div>
        <div className="map-legend-item">
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2d6a4f', flexShrink: 0 }} />
          <span>Ocupada</span>
        </div>
        <div className="map-legend-item">
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#b45309', flexShrink: 0 }} />
          <span>Mausoleo histórico</span>
        </div>
        <div className="map-legend-item">
          <div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(45, 106, 79, 0.25)', border: '1px dashed #2d6a4f', flexShrink: 0 }} />
          <span>Límite de patio</span>
        </div>
      </div>
    </div>
  );
};

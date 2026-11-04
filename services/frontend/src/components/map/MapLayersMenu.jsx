import React from 'react';
import { Layers } from 'lucide-react';

export const MapLayersMenu = ({
  isOpen,
  onToggle,
  baseMaps,
  currentBaseMap,
  onSelectBaseMap,
  showPatios,
  onTogglePatios,
  patiosCount,
  showSepulturas,
  onToggleSepulturas,
  sepulturasCount,
  showMausoleos,
  onToggleMausoleos,
  mausoleosCount
}) => {
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onToggle}
        className="btn-secondary"
        style={{ height: '36px', padding: '0 0.85rem', fontSize: '0.84rem' }}
      >
        <Layers size={15} />
        Capas
      </button>

      {isOpen && (
        <div className="map-layers-menu">
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              Mapa base
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {Object.entries(baseMaps).map(([key, bm]) => (
                <label
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    padding: '0.25rem 0.4rem',
                    borderRadius: '6px',
                    backgroundColor: currentBaseMap === key ? '#e8f5e9' : 'transparent',
                    fontWeight: currentBaseMap === key ? '600' : 'normal',
                    color: currentBaseMap === key ? '#1b4332' : '#334155'
                  }}
                >
                  <input
                    type="radio"
                    name="baseMap"
                    checked={currentBaseMap === key}
                    onChange={() => onSelectBaseMap(key)}
                  />
                  {bm.name}
                </label>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.6rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              Capas Activas
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={showPatios} onChange={(e) => onTogglePatios(e.target.checked)} />
                Patios ({patiosCount})
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={showSepulturas} onChange={(e) => onToggleSepulturas(e.target.checked)} />
                Sepulturas ({sepulturasCount})
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={showMausoleos} onChange={(e) => onToggleMausoleos(e.target.checked)} />
                Mausoleos Históricos ({mausoleosCount})
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


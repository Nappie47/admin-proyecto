import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, Layers, X, MapPin, Eye, ExternalLink, Info, Compass } from 'lucide-react';
import { sepulturaService, patioService, mausoleoService } from '../services/api';

// Custom Map Helper to move center
function MapFlyTo({ position, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom || 18, { duration: 1.2 });
    }
  }, [position, zoom, map]);
  return null;
}

// Custom Leaflet DivIcon helpers
const createCustomIcon = (color, symbol) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        font-weight: bold;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
      ">
        ${symbol || ''}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const iconOcupada = createCustomIcon('#2d6a4f', '✝');
const iconDisponible = createCustomIcon('#0284c7', '•');
const iconMantenimiento = createCustomIcon('#d97706', '!');
const iconMausoleo = createCustomIcon('#b45309', '🏛');
const iconSelected = createCustomIcon('#2563eb', '★');

export const MapPage = ({ initialGraveId, setActivePage }) => {
  const [patios, setPatios] = useState([]);
  const [sepulturas, setSepulturas] = useState([]);
  const [mausoleos, setMausoleos] = useState([]);
  const [selectedGrave, setSelectedGrave] = useState(null);
  const [mapTarget, setMapTarget] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  
  // Layer toggles (Mockup Slide 8 Left "Capas")
  const [showPatios, setShowPatios] = useState(true);
  const [showSepulturas, setShowSepulturas] = useState(true);
  const [showMausoleos, setShowMausoleos] = useState(true);
  const [layersMenuOpen, setLayersMenuOpen] = useState(false);

  // Center of Cementerio General de Los Ángeles
  const defaultCenter = [-37.4695, -72.3525];
  const [currentZoom, setCurrentZoom] = useState(17);

  useEffect(() => {
    // Load patios
    patioService.list().then(res => {
      if (res.data.success) {
        setPatios(res.data.patios);
      }
    }).catch(console.error);

    // Load sepulturas
    sepulturaService.list({ per_page: 250 }).then(res => {
      if (res.data.success) {
        setSepulturas(res.data.sepulturas);
        if (initialGraveId) {
          const target = res.data.sepulturas.find(s => s.id === initialGraveId);
          if (target) {
            setSelectedGrave(target);
            setMapTarget([target.latitud, target.longitud]);
          }
        }
      }
    }).catch(console.error);

    // Load mausoleos
    mausoleoService.list().then(res => {
      if (res.data.success) {
        setMausoleos(res.data.mausoleos);
      }
    }).catch(console.error);
  }, [initialGraveId]);

  const handleSelectGrave = (grave) => {
    setSelectedGrave(grave);
    setMapTarget([grave.latitud, grave.longitud]);
  };

  const filteredSepulturas = sepulturas.filter(s => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      s.numero.toLowerCase().includes(term) ||
      (s.nombre_fallecido && s.nombre_fallecido.toLowerCase().includes(term)) ||
      (s.apellido_paterno && s.apellido_paterno.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 72px)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Banner and Filter Bar (Slide 8 Left Mockup) */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Mapa Interactivo
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f2d1e', margin: 0 }}>
            Mapa interactivo del cementerio
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Explora el cementerio, localiza sepulturas y consulta información detallada.
          </span>
        </div>

        {/* Search bar & Capas selector */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Buscar sepultura, nombre o número..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2rem', height: '36px', fontSize: '0.84rem' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setLayersMenuOpen(!layersMenuOpen)}
              className="btn-secondary"
              style={{ height: '36px', padding: '0 0.85rem', fontSize: '0.84rem' }}
            >
              <Layers size={15} />
              Capas
            </button>

            {layersMenuOpen && (
              <div style={{ position: 'absolute', right: 0, top: '42px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '0.85rem 1rem', width: '200px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Capas Activas
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={showPatios} onChange={(e) => setShowPatios(e.target.checked)} />
                  Patios Topográficos (5)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={showSepulturas} onChange={(e) => setShowSepulturas(e.target.checked)} />
                  Sepulturas Catastradas
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={showMausoleos} onChange={(e) => setShowMausoleos(e.target.checked)} />
                  Mausoleos Históricos
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div style={{ position: 'relative', flex: 1 }}>
        <MapContainer
          center={defaultCenter}
          zoom={currentZoom}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {mapTarget && <MapFlyTo position={mapTarget} zoom={19} />}

          {/* Patios Polygons */}
          {showPatios && patios.map(patio => {
            if (!patio.geometry || patio.geometry.type !== 'Polygon') return null;
            // Leaflet expects [lat, lng], GeoJSON gives [lng, lat]
            const positions = patio.geometry.coordinates[0].map(c => [c[1], c[0]]);
            return (
              <Polygon
                key={`patio-${patio.id}`}
                positions={positions}
                pathOptions={{
                  color: patio.color_hex || '#2d6a4f',
                  fillColor: patio.color_hex || '#2d6a4f',
                  fillOpacity: 0.18,
                  weight: 2,
                  dashArray: '4, 4'
                }}
              >
                <Popup>
                  <div style={{ padding: '0.3rem' }}>
                    <h4 style={{ fontWeight: '700', color: '#1b4332', fontSize: '0.95rem' }}>{patio.nombre}</h4>
                    <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0.2rem 0' }}>{patio.descripcion}</p>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Superficie: {patio.superficie_m2} m²</div>
                  </div>
                </Popup>
              </Polygon>
            );
          })}

          {/* Sepulturas Markers */}
          {showSepulturas && filteredSepulturas.map(sep => {
            const isSelected = selectedGrave && selectedGrave.id === sep.id;
            let icon = iconOcupada;
            if (isSelected) {
              icon = iconSelected;
            } else if (sep.estado === 'Disponible') {
              icon = iconDisponible;
            } else if (sep.estado === 'En Mantenimiento') {
              icon = iconMantenimiento;
            }

            return (
              <Marker
                key={`sep-${sep.id}`}
                position={[sep.latitud, sep.longitud]}
                icon={icon}
                eventHandlers={{
                  click: () => handleSelectGrave(sep)
                }}
              >
                <Popup>
                  <div style={{ padding: '0.2rem' }}>
                    <strong>Sepultura #{sep.numero}</strong> ({sep.estado})<br />
                    <span>{sep.nombre_completo}</span><br />
                    <button 
                      onClick={() => handleSelectGrave(sep)}
                      style={{ marginTop: '0.4rem', border: 'none', background: '#2d6a4f', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      Ver ficha rápida
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Mausoleos Markers */}
          {showMausoleos && mausoleos.map(m => (
            <Marker
              key={`mausoleo-${m.id}`}
              position={[m.latitud, m.longitud]}
              icon={iconMausoleo}
              eventHandlers={{
                click: () => {
                  setSelectedGrave({
                    id: `m-${m.id}`,
                    numero: `M-${m.id}`,
                    patio_numero: m.patio_numero || 1,
                    sector: 'Histórico',
                    tipo: 'Mausoleo Histórico',
                    estado: 'Ocupada',
                    nombre_completo: m.nombre,
                    fecha_fallecimiento: `Construido en ${m.ano_construccion}`,
                    ubicacion_detalle: m.estilo_arquitectonico,
                    observaciones: m.resena_historica,
                    latitud: m.latitud,
                    longitud: m.longitud,
                    isMausoleo: true,
                    foto_url: m.foto_url
                  });
                  setMapTarget([m.latitud, m.longitud]);
                }
              }}
            >
              <Popup>
                <div>
                  <strong>{m.nombre}</strong><br />
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{m.estilo_arquitectonico} ({m.ano_construccion})</span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Bottom Left Legend Box (Matching Slide 8 Left) */}
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          padding: '1rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          zIndex: 1000,
          width: '210px',
          fontSize: '0.78rem',
        }}>
          <div style={{ fontWeight: '700', color: '#0f2d1e', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Leyenda
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2563eb', border: '1px solid white' }} />
              <span>Sepultura seleccionada</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
              <span>Sepultura disponible</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2d6a4f' }} />
              <span>Sepultura ocupada</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#b45309' }} />
              <span>Mausoleo histórico</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(45, 106, 79, 0.25)', border: '1px dashed #2d6a4f' }} />
              <span>Límite de patio</span>
            </div>
          </div>
        </div>

        {/* Slide-out Sidebar Drawer when Grave is Selected (Slide 8 Left Mockup) */}
        {selectedGrave && (
          <div style={{
            position: 'absolute',
            right: '24px',
            top: '24px',
            bottom: '24px',
            width: '350px',
            backgroundColor: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 16px 36px rgba(0,0,0,0.15)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'modalFadeIn 0.25s ease-out'
          }}>
            {/* Drawer Header */}
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f2d1e', margin: 0 }}>
                  Sepultura {selectedGrave.numero}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Patio {selectedGrave.patio_numero} • Sector {selectedGrave.sector}
                </span>
              </div>
              <button
                onClick={() => setSelectedGrave(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
              {/* Photo */}
              <div style={{ height: '140px', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem', backgroundColor: '#f1f5f9' }}>
                <img
                  src={selectedGrave.foto_url || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80"}
                  alt="Sepultura"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Data Table attributes matching Slide 8 Left */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Número</span>
                  <span style={{ fontWeight: '600' }}>{selectedGrave.numero}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Tipo</span>
                  <span style={{ fontWeight: '600' }}>{selectedGrave.tipo}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Estado</span>
                  <span className={`badge-status ${selectedGrave.estado.toLowerCase().replace(' ', '-')}`}>
                    {selectedGrave.estado}
                  </span>
                </div>
                {selectedGrave.nombre_completo && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
                    <span style={{ color: '#64748b' }}>Nombre</span>
                    <span style={{ fontWeight: '700', color: '#1b4332' }}>{selectedGrave.nombre_completo}</span>
                  </div>
                )}
                {selectedGrave.fecha_fallecimiento && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
                    <span style={{ color: '#64748b' }}>Fecha de fallecimiento</span>
                    <span style={{ fontWeight: '600' }}>{selectedGrave.fecha_fallecimiento}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Ubicación</span>
                  <span style={{ fontWeight: '600' }}>{selectedGrave.ubicacion_detalle || `Patio ${selectedGrave.patio_numero}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Coordenadas</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#475569' }}>
                    {selectedGrave.latitud?.toFixed(5)}, {selectedGrave.longitud?.toFixed(5)}
                  </span>
                </div>
              </div>

              {selectedGrave.observaciones && (
                <div style={{ marginTop: '1rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', fontSize: '0.78rem', color: '#475569', lineHeight: '1.4' }}>
                  <strong>Observaciones:</strong> {selectedGrave.observaciones}
                </div>
              )}
            </div>

            {/* Drawer Actions */}
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={() => setMapTarget([selectedGrave.latitud, selectedGrave.longitud])}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
              >
                <MapPin size={15} color="#2d6a4f" />
                Centrar en el mapa
              </button>
              {!selectedGrave.isMausoleo && (
                <button
                  onClick={() => setActivePage({ name: 'detail', id: selectedGrave.id })}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
                >
                  <Eye size={15} />
                  Ver más información
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

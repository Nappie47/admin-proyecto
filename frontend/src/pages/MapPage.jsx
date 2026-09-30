import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  Search, Layers, X, MapPin, Eye, ExternalLink, Info, Compass,
  Edit3, Plus, Trash2, Save, Database, Sparkles, Undo2, RefreshCw, CheckCircle2
} from 'lucide-react';
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

// Map Click Listener for interactive polygon drawing
function MapClickHandler({ isDrawing, onMapClick }) {
  const map = useMap();

  useEffect(() => {
    if (isDrawing) {
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.getContainer().style.cursor = '';
    }
  }, [isDrawing, map]);

  useMapEvents({
    click(e) {
      if (isDrawing) {
        onMapClick([e.latlng.lat, e.latlng.lng]);
      }
    }
  });

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

const vertexIcon = L.divIcon({
  className: 'vertex-map-marker',
  html: `
    <div style="
      background-color: #ef4444;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    "></div>
  `,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const iconOcupada = createCustomIcon('#2d6a4f', '✝');
const iconDisponible = createCustomIcon('#0284c7', '•');
const iconMantenimiento = createCustomIcon('#d97706', '!');
const iconMausoleo = createCustomIcon('#b45309', '🏛');
const iconSelected = createCustomIcon('#2563eb', '★');

const BASE_MAPS = {
  'google-hybrid': {
    name: 'Google Satélite Híbrido (Recomendado)',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20
  },
  'google-satellite': {
    name: 'Google Satélite Puro',
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20
  },
  'esri-satellite': {
    name: 'Esri Satélite SIG (Alta Resolución)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 19
  },
  'carto-voyager': {
    name: 'Carto Voyager (Plano Moderno)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    maxZoom: 19
  },
  'osm': {
    name: 'OpenStreetMap Clásico',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }
};

const COLOR_PRESETS = [
  '#1b4332', '#2d6a4f', '#40916c', '#52b788', '#74c69d',
  '#1e3a8a', '#1d4ed8', '#0284c7', '#0f766e', '#854d0e'
];

export const MapPage = ({ initialGraveId, initialOpenEditor, setActivePage }) => {
  const [patios, setPatios] = useState([]);
  const [sepulturas, setSepulturas] = useState([]);
  const [mausoleos, setMausoleos] = useState([]);
  const [selectedGrave, setSelectedGrave] = useState(null);
  const [mapTarget, setMapTarget] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  
  // Base map style
  const [currentBaseMap, setCurrentBaseMap] = useState('google-hybrid');

  // Layer toggles
  const [showPatios, setShowPatios] = useState(true);
  const [showSepulturas, setShowSepulturas] = useState(true);
  const [showMausoleos, setShowMausoleos] = useState(true);
  const [layersMenuOpen, setLayersMenuOpen] = useState(false);

  // Patio Editor State
  const [editorOpen, setEditorOpen] = useState(initialOpenEditor || false);

  useEffect(() => {
    if (initialOpenEditor !== undefined) {
      setEditorOpen(initialOpenEditor);
    }
  }, [initialOpenEditor]);

  const [editingPatio, setEditingPatio] = useState(null); // null when not in form, or patio object
  const [drawingPoints, setDrawingPoints] = useState([]); // array of [lat, lng]
  const [formData, setFormData] = useState({
    numero: '',
    nombre: '',
    descripcion: '',
    superficie_m2: '',
    color_hex: '#2d6a4f'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  // Center of Cementerio General de Los Ángeles
  const defaultCenter = [-37.4732, -72.3229];
  const [currentZoom, setCurrentZoom] = useState(17);

  const loadPatios = async () => {
    try {
      const res = await patioService.list();
      if (res.data.success) {
        setPatios(res.data.patios);
      }
    } catch (err) {
      console.error('Error cargando patios:', err);
    }
  };

  const loadSepulturas = async () => {
    try {
      const res = await sepulturaService.list({ per_page: 250 });
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
    } catch (err) {
      console.error('Error cargando sepulturas:', err);
    }
  };

  const loadMausoleos = async () => {
    try {
      const res = await mausoleoService.list();
      if (res.data.success) {
        setMausoleos(res.data.mausoleos);
      }
    } catch (err) {
      console.error('Error cargando mausoleos:', err);
    }
  };

  useEffect(() => {
    loadPatios();
    loadSepulturas();
    loadMausoleos();
  }, [initialGraveId]);

  const handleSelectGrave = (grave) => {
    setSelectedGrave(grave);
    setMapTarget([grave.latitud, grave.longitud]);
  };

  // Editor Actions
  const handleStartCreatePatio = () => {
    const nextNum = patios.length > 0 ? Math.max(...patios.map(p => p.numero)) + 1 : 1;
    setEditingPatio({ id: null });
    setFormData({
      numero: nextNum,
      nombre: `Patio ${nextNum} - Nuevo Sector`,
      descripcion: 'Sector delimitado mediante editor SIG satelital',
      superficie_m2: '4800',
      color_hex: COLOR_PRESETS[(nextNum - 1) % COLOR_PRESETS.length]
    });
    setDrawingPoints([]);
    setSelectedGrave(null);
  };

  const handleStartEditPatio = (patio) => {
    setEditingPatio(patio);
    setFormData({
      numero: patio.numero,
      nombre: patio.nombre,
      descripcion: patio.descripcion || '',
      superficie_m2: patio.superficie_m2 || '',
      color_hex: patio.color_hex || '#2d6a4f'
    });
    // Extract points from GeoJSON [lng, lat] -> [lat, lng]
    if (patio.geometry && patio.geometry.type === 'Polygon') {
      const pts = patio.geometry.coordinates[0].map(c => [c[1], c[0]]);
      setDrawingPoints(pts);
      if (pts.length > 0) {
        setMapTarget(pts[0]);
      }
    } else {
      setDrawingPoints([]);
    }
    setSelectedGrave(null);
  };

  const handleCancelEdit = () => {
    setEditingPatio(null);
    setDrawingPoints([]);
  };

  const handleMapClick = (latlng) => {
    if (editingPatio) {
      setDrawingPoints(prev => [...prev, latlng]);
    }
  };

  const handleUndoPoint = () => {
    setDrawingPoints(prev => prev.slice(0, -1));
  };

  const handleClearPoints = () => {
    setDrawingPoints([]);
  };

  const handleSavePatio = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.numero) {
      setAlertMsg({ type: 'error', text: 'El número y nombre del patio son obligatorios' });
      return;
    }
    if (drawingPoints.length < 3) {
      setAlertMsg({ type: 'error', text: 'Debe marcar al menos 3 puntos en el mapa para delimitar el polígono del patio' });
      return;
    }

    setIsSaving(true);
    setAlertMsg(null);

    // Convert [lat, lng] points to GeoJSON Polygon [[lng, lat], ...]
    const coordinates = drawingPoints.map(p => [Number(p[1].toFixed(6)), Number(p[0].toFixed(6))]);
    // Ensure closed ring
    if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
      coordinates.push(coordinates[0]);
    }

    const payload = {
      numero: Number(formData.numero),
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      superficie_m2: Number(formData.superficie_m2) || 0,
      color_hex: formData.color_hex,
      geom_geojson: {
        type: 'Polygon',
        coordinates: [coordinates]
      }
    };

    try {
      if (editingPatio.id) {
        await patioService.update(editingPatio.id, payload);
        setAlertMsg({ type: 'success', text: `¡Patio ${payload.numero} actualizado en PostgreSQL (10.0.3.10:5000)!` });
      } else {
        await patioService.create(payload);
        setAlertMsg({ type: 'success', text: `¡Patio ${payload.numero} guardado en PostgreSQL (10.0.3.10:5000)!` });
      }
      await loadPatios();
      setEditingPatio(null);
      setDrawingPoints([]);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error guardando patio';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePatio = async (patio) => {
    if (!window.confirm(`¿Está seguro de eliminar el Patio ${patio.numero} (${patio.nombre})? Esta acción se aplicará en la base de datos PostgreSQL.`)) {
      return;
    }
    try {
      await patioService.delete(patio.id);
      setAlertMsg({ type: 'success', text: `Patio ${patio.numero} eliminado exitosamente` });
      await loadPatios();
      if (editingPatio && editingPatio.id === patio.id) {
        setEditingPatio(null);
        setDrawingPoints([]);
      }
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.response?.data?.error || 'Error al eliminar patio' });
    }
  };

  const handleBootstrapDefaults = async () => {
    if (!window.confirm("¿Desea inicializar los 5 Patios Oficiales, Usuario Admin y Sepulturas en PostgreSQL (10.0.3.10:5000)?")) {
      return;
    }
    setIsBootstrapping(true);
    setAlertMsg(null);
    try {
      const res = await patioService.bootstrap();
      if (res.data.success) {
        setAlertMsg({ 
          type: 'success', 
          text: `¡Listo! Se guardaron ${res.data.total_patios} patios, ${res.data.total_usuarios} usuarios y ${res.data.total_sepulturas} sepulturas en PostgreSQL (10.0.3.10:5000).` 
        });
        await loadPatios();
        await loadSepulturas();
        await loadMausoleos();
        setMapTarget(defaultCenter);
      }
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.response?.data?.error || 'Error poblando base de datos' });
    } finally {
      setIsBootstrapping(false);
    }
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
      {/* Top Banner and Filter Bar */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            SIG Cementerio General Los Ángeles
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f2d1e', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Mapa Interactivo & Catastro
            <span style={{ fontSize: '0.72rem', backgroundColor: '#e8f5e9', color: '#1b4332', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '600' }}>
              DB: 10.0.3.10:5000
            </span>
          </h2>
        </div>

        {/* Search bar, Capas & Editor toggle */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Buscar sepultura o persona..."
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
              <div style={{ position: 'absolute', right: 0, top: '42px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 12px 28px rgba(0,0,0,0.15)', padding: '1rem', width: '270px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                    Mapa Base Satelital
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {Object.entries(BASE_MAPS).map(([key, bm]) => (
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
                          onChange={() => setCurrentBaseMap(key)}
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
                      <input type="checkbox" checked={showPatios} onChange={(e) => setShowPatios(e.target.checked)} />
                      Patios ({patios.length})
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={showSepulturas} onChange={(e) => setShowSepulturas(e.target.checked)} />
                      Sepulturas ({sepulturas.length})
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={showMausoleos} onChange={(e) => setShowMausoleos(e.target.checked)} />
                      Mausoleos Históricos ({mausoleos.length})
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botón Editor de Patios SIG */}
          <button
            onClick={() => {
              setEditorOpen(!editorOpen);
              if (!editorOpen) setSelectedGrave(null);
            }}
            className={editorOpen ? "btn-primary" : "btn-secondary"}
            style={{ 
              height: '36px', 
              padding: '0 1rem', 
              fontSize: '0.84rem',
              backgroundColor: editorOpen ? '#1b4332' : undefined,
              color: editorOpen ? 'white' : undefined
            }}
          >
            <Edit3 size={15} />
            {editorOpen ? 'Cerrar Editor' : 'Editor de Patios SIG'}
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {alertMsg && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1100,
          backgroundColor: alertMsg.type === 'success' ? '#1b4332' : '#991b1b',
          color: 'white',
          padding: '0.65rem 1.25rem',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          fontSize: '0.85rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          {alertMsg.type === 'success' ? <CheckCircle2 size={16} /> : <Info size={16} />}
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Map Area */}
      <div style={{ position: 'relative', flex: 1 }}>
        <MapContainer
          center={defaultCenter}
          zoom={currentZoom}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            key={currentBaseMap}
            attribution={BASE_MAPS[currentBaseMap].attribution}
            url={BASE_MAPS[currentBaseMap].url}
            maxZoom={BASE_MAPS[currentBaseMap].maxZoom || 20}
          />

          {mapTarget && <MapFlyTo position={mapTarget} zoom={19} />}

          {/* Click handler for polygon boundary drawing */}
          <MapClickHandler isDrawing={!!editingPatio} onMapClick={handleMapClick} />

          {/* Existing Patios Polygons */}
          {showPatios && patios.map(patio => {
            if (!patio.geometry || patio.geometry.type !== 'Polygon') return null;
            const positions = patio.geometry.coordinates[0].map(c => [c[1], c[0]]);
            const isCurrentEditing = editingPatio && editingPatio.id === patio.id;
            if (isCurrentEditing) return null; // Don't show original while editing live

            return (
              <Polygon
                key={`patio-${patio.id}`}
                positions={positions}
                pathOptions={{
                  color: patio.color_hex || '#2d6a4f',
                  fillColor: patio.color_hex || '#2d6a4f',
                  fillOpacity: 0.22,
                  weight: 2,
                  dashArray: '4, 4'
                }}
              >
                <Popup>
                  <div style={{ padding: '0.3rem' }}>
                    <h4 style={{ fontWeight: '700', color: '#1b4332', fontSize: '0.95rem', margin: 0 }}>
                      Patio {patio.numero}: {patio.nombre}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0.3rem 0' }}>{patio.descripcion}</p>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Superficie: {patio.superficie_m2} m²</div>
                    {editorOpen && (
                      <button
                        onClick={() => handleStartEditPatio(patio)}
                        style={{ marginTop: '0.5rem', background: '#2d6a4f', color: 'white', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Editar Límites
                      </button>
                    )}
                  </div>
                </Popup>
              </Polygon>
            );
          })}

          {/* Polygon being currently drawn or edited */}
          {editingPatio && drawingPoints.length >= 3 && (
            <Polygon
              positions={drawingPoints}
              pathOptions={{
                color: formData.color_hex || '#ef4444',
                fillColor: formData.color_hex || '#ef4444',
                fillOpacity: 0.35,
                weight: 3,
                dashArray: '6, 6'
              }}
            />
          )}

          {/* Markers on vertices of editing polygon */}
          {editingPatio && drawingPoints.map((pt, idx) => (
            <Marker key={`vert-${idx}`} position={pt} icon={vertexIcon}>
              <Popup>Vértice #{idx + 1}: {pt[0].toFixed(5)}, {pt[1].toFixed(5)}</Popup>
            </Marker>
          ))}

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
                  click: () => {
                    if (!editingPatio) handleSelectGrave(sep);
                  }
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
                  if (!editingPatio) {
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

        {/* Bottom Left Legend Box */}
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
            Leyenda SIG
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2563eb', border: '1px solid white' }} />
              <span>Seleccionada</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
              <span>Disponible</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2d6a4f' }} />
              <span>Ocupada</span>
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

        {/* EDITOR DE PATIOS DRAWER (Slide-out panel) */}
        {editorOpen && (
          <div style={{
            position: 'absolute',
            right: '24px',
            top: '24px',
            bottom: '24px',
            width: '380px',
            backgroundColor: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 16px 36px rgba(0,0,0,0.18)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'modalFadeIn 0.25s ease-out'
          }}>
            {/* Editor Header */}
            <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f2d1e', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Database size={17} color="#2d6a4f" />
                  Editor de Patios & Límites
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Escritura directa a PostgreSQL (10.0.3.10:5000)
                </span>
              </div>
              <button
                onClick={() => {
                  setEditorOpen(false);
                  setEditingPatio(null);
                  setDrawingPoints([]);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Editor Body */}
            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Botón Poblar Rápido Base de Datos */}
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontWeight: '700', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                  <Sparkles size={16} />
                  Poblamiento Rápido Oficial
                </div>
                <p style={{ fontSize: '0.75rem', color: '#14532d', margin: '0 0 0.6rem 0', lineHeight: '1.4' }}>
                  Inicializa los 5 patios oficiales con sus límites satelitales reales, el usuario administrador y sepulturas de muestra.
                </p>
                <button
                  type="button"
                  onClick={handleBootstrapDefaults}
                  disabled={isBootstrapping}
                  className="btn-primary"
                  style={{ width: '100%', fontSize: '0.78rem', padding: '0.45rem', justifyContent: 'center' }}
                >
                  {isBootstrapping ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Escribiendo en 10.0.3.10:5000...
                    </>
                  ) : (
                    <>
                      <Database size={14} />
                      Poblar 5 Patios & Admin en DB
                    </>
                  )}
                </button>
              </div>

              {/* Si estamos creando o editando un patio */}
              {editingPatio ? (
                <form onSubmit={handleSavePatio} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '700', color: '#1b4332', fontSize: '0.9rem' }}>
                      {editingPatio.id ? `Modificar Patio ${formData.numero}` : 'Nuevo Patio'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="btn-secondary"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      Cancelar
                    </button>
                  </div>

                  {/* Instrucciones de Dibujo */}
                  <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.65rem', fontSize: '0.76rem', color: '#1e40af' }}>
                    <strong>Modo Dibujo Activo:</strong> Haz clic sobre el mapa para marcar los vértices perimetrales del patio.
                    <div style={{ marginTop: '0.35rem', fontWeight: '700' }}>
                      Vértices marcados: {drawingPoints.length} {drawingPoints.length >= 3 ? '✓ (Polígono válido)' : '(Mínimo 3)'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleUndoPoint}
                      disabled={drawingPoints.length === 0}
                      className="btn-secondary"
                      style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem' }}
                    >
                      <Undo2 size={13} />
                      Deshacer punto
                    </button>
                    <button
                      type="button"
                      onClick={handleClearPoints}
                      disabled={drawingPoints.length === 0}
                      className="btn-secondary"
                      style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem' }}
                    >
                      Limpiar todo
                    </button>
                  </div>

                  {/* Campos del Formulario */}
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <div style={{ width: '90px' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                        Número
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        required
                        className="form-input"
                        value={formData.numero}
                        onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                        style={{ height: '34px', fontSize: '0.84rem' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                        Superficie (m²)
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Ej: 4500"
                        value={formData.superficie_m2}
                        onChange={(e) => setFormData({ ...formData, superficie_m2: e.target.value })}
                        style={{ height: '34px', fontSize: '0.84rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                      Nombre del Patio
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Patio 1 - Acceso Histórico"
                      className="form-input"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      style={{ height: '34px', fontSize: '0.84rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                      Descripción / Sector
                    </label>
                    <textarea
                      rows={2}
                      className="form-input"
                      placeholder="Breve reseña del sector o patio..."
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      style={{ fontSize: '0.8rem', resize: 'vertical' }}
                    />
                  </div>

                  {/* Selector de color */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                      Color del Polígono
                    </label>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {COLOR_PRESETS.map(col => (
                        <div
                          key={col}
                          onClick={() => setFormData({ ...formData, color_hex: col })}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            backgroundColor: col,
                            cursor: 'pointer',
                            border: formData.color_hex === col ? '2px solid black' : '1px solid rgba(0,0,0,0.15)',
                            transform: formData.color_hex === col ? 'scale(1.15)' : 'none'
                          }}
                        />
                      ))}
                      <input
                        type="color"
                        value={formData.color_hex}
                        onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                        style={{ width: '32px', height: '26px', padding: 0, border: 'none', cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  {/* Botón Guardar en DB */}
                  <button
                    type="submit"
                    disabled={isSaving || drawingPoints.length < 3}
                    className="btn-primary"
                    style={{ marginTop: '0.5rem', justifyContent: 'center', height: '38px', fontSize: '0.85rem' }}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        Guardando en PostgreSQL...
                      </>
                    ) : (
                      <>
                        <Save size={15} />
                        Guardar en DB (10.0.3.10:5000)
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Lista de Patios Existentes */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>
                      Patios en Base de Datos ({patios.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleStartCreatePatio}
                      className="btn-primary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    >
                      <Plus size={14} />
                      Crear Patio
                    </button>
                  </div>

                  {patios.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '0.82rem' }}>
                      No hay patios en la base de datos.<br />
                      Usa el botón de arriba para poblar los 5 oficiales o crea uno nuevo con el cursor.
                    </div>
                  ) : (
                    patios.map(p => (
                      <div
                        key={p.id}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          backgroundColor: '#fafafa',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.4rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: p.color_hex || '#2d6a4f' }} />
                            <strong style={{ fontSize: '0.85rem', color: '#0f2d1e' }}>
                              Patio {p.numero}: {p.nombre}
                            </strong>
                          </div>
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <button
                              onClick={() => handleStartEditPatio(p)}
                              title="Editar límites satelitales"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', padding: '2px' }}
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeletePatio(p)}
                              title="Eliminar patio de la base de datos"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {p.descripcion || 'Sin descripción'}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#475569', borderTop: '1px solid #f1f5f9', paddingTop: '0.3rem' }}>
                          <span>Superficie: {p.superficie_m2} m²</span>
                          <span>Sepulturas: {p.total_sepulturas || 0}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Slide-out Sidebar Drawer when Grave is Selected */}
        {selectedGrave && !editorOpen && (
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

              {/* Data Table */}
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

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { 
  Search, Edit3, X, CheckCircle2, Info 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { patioService, sepulturaService, mausoleoService } from '../services/api';
import { MapLegend } from '../components/map/MapLegend';
import { MapLayersMenu } from '../components/map/MapLayersMenu';
import { PatioEditorDrawer } from '../components/map/PatioEditorDrawer';
import { GraveDetailDrawer } from '../components/map/GraveDetailDrawer';
import '../components/map/MapPage.css';

const GoogleCemeteryMap = lazy(() => import('../components/GoogleCemeteryMap'));
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const BASE_MAPS = {
  'google-satellite': { name: 'Google Satélite' },
  'google-roadmap': { name: 'Google Calles' }
};

const COLOR_PRESETS = [
  '#2d6a4f', '#1b4332', '#40916c', '#52b788',
  '#2563eb', '#0284c7', '#7c3aed', '#b45309',
  '#dc2626', '#475569'
];

export const MapPage = ({ initialGraveId, initialPatioId, initialOpenEditor, setActivePage }) => {
  const { isFuncionario, loading: authLoading } = useAuth();
  const canEditPatios = isFuncionario && !authLoading;
  const [patios, setPatios] = useState([]);
  const [sepulturas, setSepulturas] = useState([]);
  const [mausoleos, setMausoleos] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [dataLoadError, setDataLoadError] = useState(null);
  const [selectedGrave, setSelectedGrave] = useState(null);
  const [mapTarget, setMapTarget] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Control de Mapas Base y Capas
  const [currentBaseMap, setCurrentBaseMap] = useState('google-satellite');

  // Capas visibles
  const [showPatios, setShowPatios] = useState(true);
  const [showSepulturas, setShowSepulturas] = useState(true);
  const [showMausoleos, setShowMausoleos] = useState(true);
  const [layersMenuOpen, setLayersMenuOpen] = useState(false);

  // Modo Editor de Patios (SIG)
  const [editorOpen, setEditorOpen] = useState(false);
  useEffect(() => {
    if (initialOpenEditor) {
      setEditorOpen(true);
    }
  }, [initialOpenEditor]);

  const [editingPatio, setEditingPatio] = useState(null);
  const initialPatioEditStarted = useRef(false);
  const [drawingPoints, setDrawingPoints] = useState([]); // array of [lat, lng]
  const [formData, setFormData] = useState({
    numero: '',
    nombre: '',
    descripcion: '',
    color_hex: '#2d6a4f',
    superficie_m2: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  const defaultCenter = [-37.4732, -72.3229];
  const [currentZoom] = useState(18);

  const loadPatios = async () => {
    try {
      const res = await patioService.list();
      if (res.data.success) {
        setPatios(res.data.patios);
      }
    } catch (err) {
      console.error('Error cargando patios:', err);
      setDataLoadError(err.response?.data?.error || err.message || 'Error cargando patios.');
    }
  };

  const loadSepulturas = async () => {
    try {
      const allSepulturas = [];
      let page = 1;
      let totalPages = 1;

      do {
        const res = await sepulturaService.list({ page, per_page: 250 });
        if (res.data.success) {
          allSepulturas.push(...res.data.sepulturas);
          totalPages = res.data.pages || 1;
          page += 1;
        } else {
          break;
        }
      } while (page <= totalPages);

      setSepulturas(allSepulturas);

      if (initialGraveId) {
        const target = allSepulturas.find(s => s.id === initialGraveId);
        if (target) {
          setSelectedGrave(target);
          setMapTarget([target.latitud, target.longitud]);
        }
      }
    } catch (err) {
      console.error('Error cargando sepulturas en el mapa:', err);
      setDataLoadError(err.response?.data?.error || err.message || 'Error cargando sepulturas.');
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
    let isCurrentRequest = true;

    const loadMapData = async () => {
      setIsLoadingRecords(true);
      setDataLoadError(null);
      try {
        await Promise.all([loadPatios(), loadSepulturas(), loadMausoleos()]);
      } catch (err) {
        if (isCurrentRequest) {
          setDataLoadError(err.message || 'Error cargando registros del cementerio.');
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoadingRecords(false);
        }
      }
    };

    loadMapData();

    return () => {
      isCurrentRequest = false;
    };
  }, [initialGraveId]);

  // Suscripción WebSocket en tiempo real para actualizaciones automáticas del mapa
  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;
    let isMounted = true;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/map`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (isMounted) {
            console.log('[WebSocket SIG] Conectado a canal en tiempo real.');
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'map_updated') {
              console.log('[WebSocket SIG] Actualización recibida. Recargando capas...', data);
              loadPatios();
              loadSepulturas();
              loadMausoleos();
            }
          } catch (e) {
            console.error('[WebSocket SIG] Error procesando mensaje:', e);
          }
        };

        ws.onclose = () => {
          if (isMounted) {
            reconnectTimer = setTimeout(connectWebSocket, 3000);
          }
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (err) {
        console.warn('[WebSocket SIG] No se pudo inicializar WebSocket:', err);
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  const handleSelectGrave = (grave) => {
    setSelectedGrave(grave);
    setMapTarget([grave.latitud, grave.longitud]);
  };

  const handleStartCreatePatio = () => {
    setEditingPatio({ isNew: true });
    setDrawingPoints([]);
    setFormData({
      numero: '',
      nombre: '',
      descripcion: '',
      color_hex: '#2d6a4f',
      superficie_m2: ''
    });
  };

  const handleStartEditPatio = (patio) => {
    setEditorOpen(true);
    setEditingPatio(patio);
    setFormData({
      numero: patio.numero,
      nombre: patio.nombre || '',
      descripcion: patio.descripcion || '',
      color_hex: patio.color_hex || '#2d6a4f',
      superficie_m2: patio.superficie_m2 || ''
    });

    if (patio.geometry && patio.geometry.type === 'Polygon') {
      const ring = patio.geometry.coordinates[0];
      const pts = ring.slice(0, ring.length - 1).map(c => [c[1], c[0]]);
      setDrawingPoints(pts);
      if (pts.length > 0) {
        setMapTarget(pts[0]);
      }
    } else {
      setDrawingPoints([]);
    }
  };

  useEffect(() => {
    if (initialPatioId && patios.length > 0 && !initialPatioEditStarted.current) {
      const patio = patios.find(p => p.id === initialPatioId);
      if (patio) {
        initialPatioEditStarted.current = true;
        handleStartEditPatio(patio);
      }
    }
  }, [initialPatioId, patios]);

  const handleCancelEdit = () => {
    setEditingPatio(null);
    setDrawingPoints([]);
  };

  const handleMapClick = (latlng) => {
    if (editorOpen && editingPatio) {
      setDrawingPoints(prev => [...prev, latlng]);
    }
  };

  const handleUndoPoint = () => {
    setDrawingPoints(prev => prev.slice(0, prev.length - 1));
  };

  const handleClearPoints = () => {
    setDrawingPoints([]);
  };

  const handleSavePatio = async (e) => {
    e.preventDefault();
    if (drawingPoints.length < 3) {
      setAlertMsg({ type: 'error', text: 'Debes marcar al menos 3 vértices en el mapa para delimitar el polígono.' });
      return;
    }

    setIsSaving(true);
    setAlertMsg(null);

    try {
      const coords = drawingPoints.map(p => [p[1], p[0]]);
      coords.push(coords[0]); // Cerrar el polígono
      const geojson = {
        type: 'Polygon',
        coordinates: [coords]
      };

      const payload = {
        numero: parseInt(formData.numero, 10),
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        color_hex: formData.color_hex,
        superficie_m2: formData.superficie_m2 ? parseFloat(formData.superficie_m2) : null,
        geometry: geojson
      };

      if (editingPatio.id) {
        await patioService.update(editingPatio.id, payload);
        setAlertMsg({ type: 'success', text: `Patio ${formData.numero} actualizado correctamente.` });
      } else {
        await patioService.create(payload);
        setAlertMsg({ type: 'success', text: `Patio ${formData.numero} creado con éxito.` });
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
    if (!window.confirm(`¿Está seguro de eliminar el Patio ${patio.numero} (${patio.nombre})?`)) {
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
    <div className="map-page">
      {/* Top Banner and Filter Bar */}
      <div className="map-page-header">
        <div>
          <span className="map-page-title-badge">
            SIG Cementerio General Los Ángeles
          </span>
          <h2 className="map-page-title">
            Mapa interactivo del cementerio
          </h2>
        </div>

        {/* Search bar, Capas & Editor toggle */}
        <div className="map-page-toolbar">
          <div style={{ position: 'relative', width: '220px', flex: '1 1 180px' }}>
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

          <MapLayersMenu
            isOpen={layersMenuOpen}
            onToggle={() => setLayersMenuOpen(!layersMenuOpen)}
            baseMaps={BASE_MAPS}
            currentBaseMap={currentBaseMap}
            onSelectBaseMap={setCurrentBaseMap}
            showPatios={showPatios}
            onTogglePatios={setShowPatios}
            patiosCount={patios.length}
            showSepulturas={showSepulturas}
            onToggleSepulturas={setShowSepulturas}
            sepulturasCount={sepulturas.length}
            showMausoleos={showMausoleos}
            onToggleMausoleos={setShowMausoleos}
            mausoleosCount={mausoleos.length}
          />

          {canEditPatios && (
            <button
              onClick={() => {
                setEditorOpen(!editorOpen);
                if (!editorOpen) {
                  setSelectedGrave(null);
                }
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
          )}
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
      <div className="map-stage">
        {googleMapsApiKey ? (
          <Suspense fallback={<div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', color: '#475569' }}>Cargando Google Maps...</div>}>
            <GoogleCemeteryMap
              apiKey={googleMapsApiKey}
              mapTypeId={currentBaseMap === 'google-roadmap' ? 'roadmap' : 'satellite'}
              center={defaultCenter}
              zoom={currentZoom}
              mapTarget={mapTarget}
              editingPatio={editingPatio}
              onMapClick={handleMapClick}
              patios={patios}
              sepulturas={filteredSepulturas}
              mausoleos={mausoleos}
              showPatios={showPatios}
              showSepulturas={showSepulturas}
              showMausoleos={showMausoleos}
              selectedGrave={selectedGrave}
              editorOpen={editorOpen}
              drawingPoints={drawingPoints}
              drawingColor={formData.color_hex}
              onSelectGrave={handleSelectGrave}
              onStartEditPatio={handleStartEditPatio}
              onMapLoadError={() => {
                setAlertMsg({ type: 'error', text: 'Google Maps no se pudo cargar. Revisa la clave de API, sus permisos y la conexión.' });
              }}
              isLoadingRecords={isLoadingRecords}
              dataLoadError={dataLoadError}
            />
          </Suspense>
        ) : (
          <div role="alert" style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', padding: '1.5rem', textAlign: 'center', color: '#991b1b', backgroundColor: '#fff7ed' }}>
            Google Maps no está disponible porque falta configurar VITE_GOOGLE_MAPS_API_KEY en frontend/.env.local.
          </div>
        )}

        {/* Bottom Left Legend Box */}
        <MapLegend />

        {/* EDITOR DE PATIOS DRAWER (Slide-out panel) */}
        <PatioEditorDrawer
          isOpen={editorOpen}
          onClose={() => {
            setEditorOpen(false);
            setEditingPatio(null);
            setDrawingPoints([]);
          }}
          editingPatio={editingPatio}
          onCancelEdit={handleCancelEdit}
          drawingPoints={drawingPoints}
          onUndoPoint={handleUndoPoint}
          onClearPoints={handleClearPoints}
          formData={formData}
          setFormData={setFormData}
          colorPresets={COLOR_PRESETS}
          onSavePatio={handleSavePatio}
          isSaving={isSaving}
          patios={patios}
          onStartCreatePatio={handleStartCreatePatio}
          onStartEditPatio={handleStartEditPatio}
          onDeletePatio={handleDeletePatio}
        />

        {/* Slide-out Sidebar Drawer when Grave is Selected */}
        <GraveDetailDrawer
          grave={selectedGrave && !editorOpen ? selectedGrave : null}
          onClose={() => setSelectedGrave(null)}
          onCenterOnMap={() => setMapTarget([selectedGrave.latitud, selectedGrave.longitud])}
          onViewDetails={() => setActivePage({ name: 'detail', id: selectedGrave.id })}
        />
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Share2, MapPin, Calendar, Compass, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import { sepulturaService } from '../services/api';

const miniPinIcon = L.divIcon({
  className: 'mini-map-pin',
  html: `
    <div style="
      background-color: #2563eb;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY;
const detailMapUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

export const GraveDetailPage = ({ graveId, setActivePage }) => {
  const [grave, setGrave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (graveId) {
      sepulturaService.get(graveId)
        .then(res => {
          if (res.data.success) {
            setGrave(res.data.sepultura);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [graveId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '4rem auto', textAlign: 'center', color: '#64748b' }}>
        Cargando ficha de sepultura...
      </div>
    );
  }

  if (!grave) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <h3>Sepultura no encontrada</h3>
        <button onClick={() => setActivePage({ name: 'search' })} className="btn-primary" style={{ marginTop: '1rem' }}>
          Volver al buscador
        </button>
      </div>
    );
  }

  const isOcupada = grave.estado === 'Ocupada';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Breadcrumbs (Mockup Slide 8 Right) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
        <span onClick={() => setActivePage({ name: 'home' })} style={{ cursor: 'pointer' }}>Inicio</span>
        <span>&gt;</span>
        <span onClick={() => setActivePage({ name: 'map' })} style={{ cursor: 'pointer' }}>Mapa</span>
        <span>&gt;</span>
        <span style={{ color: '#0f2d1e', fontWeight: '600' }}>Sepultura {grave.numero}</span>
      </div>

      {/* Page Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f2d1e', margin: 0 }}>
          Detalle de sepultura
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
          Consulta toda la información disponible de la sepultura seleccionada.
        </p>
      </div>

      {/* Main Grid: Data Card + Mini Map */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        {/* Left: Detailed Alphanumeric Specs */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          {/* Card Header with Badges */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2d6a4f', fontSize: '1.2rem', fontWeight: 'bold' }}>
                ✝
              </div>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f2d1e', margin: 0 }}>
                  Sepultura {grave.numero}
                </h2>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Patio {grave.patio_numero} • Sector {grave.sector}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <span className={`badge-status ${grave.estado.toLowerCase().replace(' ', '-')}`}>
                {grave.estado}
              </span>
              <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.76rem', fontWeight: '600' }}>
                {grave.tipo}
              </span>
            </div>
          </div>

          {/* Attributes Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Patio</span>
              <span style={{ fontWeight: '700', color: '#1e293b' }}>Patio {grave.patio_numero} ({grave.patio_nombre || 'General'})</span>
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Número</span>
              <span style={{ fontWeight: '700', color: '#1e293b' }}>{grave.numero}</span>
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Tipo de Asignación</span>
              <span style={{ fontWeight: '600', color: '#1e293b' }}>{grave.tipo}</span>
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Estado Actual</span>
              <span style={{ fontWeight: '600', color: '#1e293b' }}>{grave.estado}</span>
            </div>

            {isOcupada && (
              <>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Nombre Titular / Fallecido</span>
                  <span style={{ fontWeight: '700', color: '#1b4332' }}>{grave.nombre_completo}</span>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Fecha de Fallecimiento</span>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>{grave.fecha_fallecimiento || 'No registrada'}</span>
                </div>
              </>
            )}
          </div>

          {/* Ubicación y Registro */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.84rem' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Ubicación</span>
              <span style={{ fontWeight: '600', color: '#334155' }}>{grave.ubicacion_detalle}</span>
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Registrado en el sistema</span>
              <span style={{ fontWeight: '600', color: '#334155' }}>
                {grave.created_at
                  ? new Date(grave.created_at).toLocaleDateString('es-CL')
                  : 'Sin fecha registrada'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Mini-Map Locator */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700', color: '#0f2d1e', marginBottom: '1rem', fontSize: '1rem' }}>
            <MapPin size={18} color="#2d6a4f" />
            Ubicación en el mapa
          </div>

          <div style={{ flex: 1, minHeight: '260px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative', marginBottom: '1rem' }}>
            <MapContainer
              center={[grave.latitud, grave.longitud]}
              zoom={18}
              zoomControl={false}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                attribution="&copy; CARTO &copy; OpenStreetMap"
                url={cartoApiKey ? `${detailMapUrl}?key=${encodeURIComponent(cartoApiKey)}` : detailMapUrl}
                maxZoom={20}
              />
              <Marker position={[grave.latitud, grave.longitud]} icon={miniPinIcon} />
            </MapContainer>
          </div>

          <button
            onClick={() => setActivePage({ name: 'map', selectedGraveId: grave.id })}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.65rem' }}
          >
            <MapPin size={16} />
            Ver en el mapa interactivo
          </button>
        </div>
      </div>

      {/* Buttons toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={() => setActivePage({ name: 'search' })}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={16} />
          Volver al buscador
        </button>

        <button
          onClick={handleShare}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Share2 size={16} />
          {copied ? '¡Enlace copiado!' : 'Compartir ficha'}
        </button>
      </div>

      {/* Municipal Notice Box (Slide 8 Right Mockup) */}
      <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
        <Info size={20} color="#166534" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.84rem', color: '#166534', lineHeight: '1.5' }}>
          <strong>Información importante:</strong> Los datos aquí mostrados provienen del registro oficial del Cementerio General de la Municipalidad de Los Ángeles. Si detecta alguna discrepancia o requiere solicitar una actualización de antecedentes, comuníquese con el departamento de catastro municipal.
        </div>
      </div>
    </div>
  );
};

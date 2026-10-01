import React, { lazy, Suspense, useState, useEffect } from 'react';
import { X, Save, AlertCircle, MapPin } from 'lucide-react';
import { sepulturaService } from '../services/api';

const DEFAULT_CENTER = [-37.4732, -72.3229];
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GoogleGraveLocationPicker = lazy(() => import('./GoogleGraveLocationPicker'));

const getPatioMapCenter = (patio, fallback) => {
  const ring = patio?.geometry?.type === 'Polygon'
    ? patio.geometry.coordinates?.[0]
    : null;
  const vertices = ring?.slice(0, -1) || [];
  if (vertices.length === 0) return fallback;

  const points = vertices.filter(
    point => Array.isArray(point)
      && Number.isFinite(Number(point[0]))
      && Number.isFinite(Number(point[1]))
  );
  if (points.length === 0) return fallback;

  return {
    lat: points.reduce((sum, point) => sum + Number(point[1]), 0) / points.length,
    lng: points.reduce((sum, point) => sum + Number(point[0]), 0) / points.length,
  };
};

export const GraveModal = ({
  isOpen,
  onClose,
  sepultura,
  patios = [],
  patiosLoading = false,
  patiosError,
  onRetryPatios,
  onCreatePatio,
  onSaved,
}) => {
  const isEditing = Boolean(sepultura && sepultura.id);
  
  const [formData, setFormData] = useState({
    numero: '',
    patio_numero: '',
    sector: 'A',
    tipo: 'Individual',
    estado: 'Disponible',
    nombre_fallecido: '',
    apellido_paterno: '',
    apellido_materno: '',
    fecha_nacimiento: '',
    fecha_fallecimiento: '',
    observaciones: '',
    ubicacion_detalle: '',
    latitud: DEFAULT_CENTER[0],
    longitud: DEFAULT_CENTER[1],
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  useEffect(() => {
    if (sepultura) {
      setFormData({
        numero: sepultura.numero || '',
        patio_numero: sepultura.patio_numero ?? '',
        sector: sepultura.sector || 'A',
        tipo: sepultura.tipo || 'Individual',
        estado: sepultura.estado || 'Disponible',
        nombre_fallecido: sepultura.nombre_fallecido || '',
        apellido_paterno: sepultura.apellido_paterno || '',
        apellido_materno: sepultura.apellido_materno || '',
        fecha_nacimiento: sepultura.fecha_nacimiento || '',
        fecha_fallecimiento: sepultura.fecha_fallecimiento || '',
        observaciones: sepultura.observaciones || '',
        ubicacion_detalle: sepultura.ubicacion_detalle || '',
        latitud: sepultura.latitud ?? DEFAULT_CENTER[0],
        longitud: sepultura.longitud ?? DEFAULT_CENTER[1],
      });
      setLocationConfirmed(sepultura.latitud != null && sepultura.longitud != null);
    } else {
      setFormData({
        numero: '',
        patio_numero: '',
        sector: 'A',
        tipo: 'Individual',
        estado: 'Disponible',
        nombre_fallecido: '',
        apellido_paterno: '',
        apellido_materno: '',
        fecha_nacimiento: '',
        fecha_fallecimiento: '',
        observaciones: '',
        ubicacion_detalle: '',
        latitud: DEFAULT_CENTER[0],
        longitud: DEFAULT_CENTER[1],
      });
      setLocationConfirmed(false);
    }
    setError(null);
  }, [sepultura, isOpen]);

  useEffect(() => {
    if (isOpen && !isEditing && !formData.patio_numero && patios.length > 0) {
      setFormData(prev => ({ ...prev, patio_numero: patios[0].numero }));
    }
  }, [formData.patio_numero, isEditing, isOpen, patios]);

  if (!isOpen) return null;
  const selectedPatio = patios.find(
    patio => Number(patio.numero) === Number(formData.patio_numero)
  );
  const mapFallbackCenter = {
    lat: Number(formData.latitud) || DEFAULT_CENTER[0],
    lng: Number(formData.longitud) || DEFAULT_CENTER[1],
  };
  const mapCenter = getPatioMapCenter(selectedPatio, mapFallbackCenter);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'patio_numero') {
      setLocationConfirmed(false);
      setError(null);
    }
  };

  const handleLocationPick = (latitud, longitud) => {
    setFormData(prev => ({
      ...prev,
      latitud: latitud.toFixed(6),
      longitud: longitud.toFixed(6),
    }));
    setLocationConfirmed(true);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!locationConfirmed) {
      setError('Haz clic en el mapa satelital para seleccionar la ubicación de la sepultura.');
      return;
    }
    if (!formData.patio_numero || patios.length === 0) {
      setError('Debes crear y seleccionar un patio antes de registrar la sepultura.');
      return;
    }
    setLoading(true);

    try {
      const payload = {
        ...formData,
        patio_numero: Number(formData.patio_numero),
        latitud: parseFloat(formData.latitud),
        longitud: parseFloat(formData.longitud),
      };

      if (isEditing) {
        await sepulturaService.update(sepultura.id, payload);
      } else {
        await sepulturaService.create(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la sepultura');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f2d1e' }}>
            {isEditing ? `Editar Sepultura #${sepultura.numero}` : 'Registrar Nueva Sepultura (RF04)'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={22} />
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>Número *</label>
              <input 
                type="text" 
                name="numero" 
                value={formData.numero} 
                onChange={handleChange} 
                required 
                className="form-input" 
                placeholder="Ej. 104"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>Patio *</label>
              <select
                name="patio_numero"
                value={formData.patio_numero}
                onChange={handleChange}
                className="form-select"
                style={{ width: '100%' }}
                required
                disabled={patiosLoading || patios.length === 0}
              >
                <option value="">
                  {patiosLoading ? 'Cargando patios...' : 'Selecciona un patio'}
                </option>
                {patios.map(patio => (
                  <option key={patio.id} value={patio.numero}>
                    Patio {patio.numero} — {patio.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>Sector *</label>
              <select name="sector" value={formData.sector} onChange={handleChange} className="form-select" style={{ width: '100%' }}>
                <option value="A">Sector A</option>
                <option value="B">Sector B</option>
                <option value="C">Sector C</option>
                <option value="D">Sector D</option>
              </select>
            </div>
          </div>

          {!patiosLoading && patios.length === 0 && (
            <div
              role="status"
              style={{
                marginBottom: '1rem',
                padding: '0.85rem',
                borderRadius: '8px',
                border: '1px solid #fed7aa',
                backgroundColor: '#fff7ed',
                color: '#9a3412',
                fontSize: '0.84rem',
              }}
            >
              <div>{patiosError || 'No hay patios registrados. Debes crear el patio real antes de agregar tumbas.'}</div>
              {patiosError && onRetryPatios && (
                <button
                  type="button"
                  onClick={onRetryPatios}
                  className="btn-secondary"
                  style={{ marginTop: '0.65rem', padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                >
                  Reintentar carga de patios
                </button>
              )}
              {!patiosError && onCreatePatio && (
                <button
                  type="button"
                  onClick={onCreatePatio}
                  className="btn-primary"
                  style={{ marginTop: '0.65rem', padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                >
                  Ir a crear un patio
                </button>
              )}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '600' }}>
                <MapPin size={15} color="#2d6a4f" />
                Ubicación de la sepultura
              </label>
              <span style={{ fontSize: '0.74rem', color: locationConfirmed ? '#166534' : '#64748b' }}>
                {locationConfirmed ? 'Ubicación marcada en el mapa' : 'Haz clic en el punto exacto de la sepultura'}
              </span>
            </div>
            <div style={{ height: '320px', border: '1px solid #dbe3e9', borderRadius: '10px', overflow: 'hidden' }}>
              {googleMapsApiKey ? (
                <Suspense fallback={<div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#64748b', fontSize: '0.85rem' }}>Cargando mapa satelital...</div>}>
                  <GoogleGraveLocationPicker
                    apiKey={googleMapsApiKey}
                    center={mapCenter}
                    patioGeometry={selectedPatio?.geometry}
                    selectedLocation={locationConfirmed ? mapFallbackCenter : null}
                    locationConfirmed={locationConfirmed}
                    mapKey={`${isOpen}-${sepultura?.id || 'new'}-${selectedPatio?.id || 'no-patio'}`}
                    onPick={handleLocationPick}
                  />
                </Suspense>
              ) : (
                <div style={{ display: 'grid', placeItems: 'center', height: '100%', padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  Configura VITE_GOOGLE_MAPS_API_KEY en frontend/.env.local para habilitar el mapa satelital.
                </div>
              )}
            </div>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.78rem', color: '#475569', lineHeight: '1.4' }}>
              El contorno verde muestra el patio seleccionado. Acerca el zoom y haz clic sobre la sepultura; el pin rojo muestra la ubicación y las coordenadas se completan automáticamente. El servidor también valida que el punto quede dentro del patio.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>Tipo *</label>
              <select name="tipo" value={formData.tipo} onChange={handleChange} className="form-select" style={{ width: '100%' }}>
                <option value="Individual">Individual</option>
                <option value="Familiar">Familiar</option>
                <option value="Nicho">Nicho</option>
                <option value="Mausoleo">Mausoleo</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>Estado *</label>
              <select name="estado" value={formData.estado} onChange={handleChange} className="form-select" style={{ width: '100%' }}>
                <option value="Disponible">Disponible</option>
                <option value="Ocupada">Ocupada</option>
                <option value="En Mantenimiento">En Mantenimiento</option>
              </select>
            </div>
          </div>

          {formData.estado === 'Disponible' && (
            <div
              role="note"
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #fed7aa',
                backgroundColor: '#fff7ed',
                color: '#9a3412',
                fontSize: '0.84rem',
              }}
            >
              Al guardar como disponible se borrarán los datos del fallecido asociados a esta sepultura.
            </div>
          )}

          {formData.estado === 'Ocupada' && (
            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e4d3b', marginBottom: '0.75rem' }}>
                Datos del Fallecido (RF04 / RF07)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '0.2rem' }}>Nombre</label>
                  <input type="text" name="nombre_fallecido" value={formData.nombre_fallecido} onChange={handleChange} className="form-input" placeholder="Ej. Juan" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '0.2rem' }}>Apellido Paterno</label>
                  <input type="text" name="apellido_paterno" value={formData.apellido_paterno} onChange={handleChange} className="form-input" placeholder="Ej. Pérez" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '0.2rem' }}>Apellido Materno</label>
                  <input type="text" name="apellido_materno" value={formData.apellido_materno} onChange={handleChange} className="form-input" placeholder="Ej. González" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '0.2rem' }}>Fecha de Nacimiento</label>
                  <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} className="form-input" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '0.2rem' }}>Fecha de Fallecimiento</label>
                  <input type="date" name="fecha_fallecimiento" value={formData.fecha_fallecimiento} onChange={handleChange} className="form-input" />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>Latitud seleccionada</label>
              <input type="text" value={locationConfirmed ? formData.latitud : 'Selecciona en el mapa'} readOnly className="form-input" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>Longitud seleccionada</label>
              <input type="text" value={locationConfirmed ? formData.longitud : 'Selecciona en el mapa'} readOnly className="form-input" />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>Ubicación Detalle / Referencia</label>
            <input type="text" name="ubicacion_detalle" value={formData.ubicacion_detalle} onChange={handleChange} className="form-input" placeholder="Ej. Patio 2, Fila 4, Número 104" />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>Observaciones</label>
            <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} rows={2} className="form-input" placeholder="Estado de mantención, regularización..." />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              <Save size={16} />
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar Sepultura' : 'Crear Sepultura')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

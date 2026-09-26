import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { sepulturaService } from '../services/api';

export const GraveModal = ({ isOpen, onClose, sepultura, onSaved }) => {
  const isEditing = Boolean(sepultura && sepultura.id);
  
  const [formData, setFormData] = useState({
    numero: '',
    patio_numero: 1,
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
    latitud: -37.46820,
    longitud: -72.35210,
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sepultura) {
      setFormData({
        numero: sepultura.numero || '',
        patio_numero: sepultura.patio_numero || 1,
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
        latitud: sepultura.latitud || -37.46820,
        longitud: sepultura.longitud || -72.35210,
      });
    } else {
      setFormData({
        numero: '',
        patio_numero: 1,
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
        latitud: -37.46820,
        longitud: -72.35210,
      });
    }
    setError(null);
  }, [sepultura, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        ...formData,
        patio_numero: parseInt(formData.patio_numero, 10),
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
              <select name="patio_numero" value={formData.patio_numero} onChange={handleChange} className="form-select" style={{ width: '100%' }}>
                <option value={1}>Patio 1 (Acceso Histórico)</option>
                <option value={2}>Patio 2 (Sector Central)</option>
                <option value={3}>Patio 3 (Pradera Sur)</option>
                <option value={4}>Patio 4 (Av. Los Álamos)</option>
                <option value={5}>Patio 5 (Ampliación)</option>
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
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>Latitud (WGS84) *</label>
              <input type="number" step="0.000001" name="latitud" value={formData.latitud} onChange={handleChange} required className="form-input" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>Longitud (WGS84) *</label>
              <input type="number" step="0.000001" name="longitud" value={formData.longitud} onChange={handleChange} required className="form-input" />
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

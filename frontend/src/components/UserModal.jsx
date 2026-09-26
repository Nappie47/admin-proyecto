import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, UserCheck } from 'lucide-react';
import { userService } from '../services/api';

export const UserModal = ({ isOpen, onClose, user, onSaved }) => {
  const isEditing = Boolean(user && user.id);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    nombre_completo: '',
    rol: 'funcionario',
    activo: true,
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '',
        nombre_completo: user.nombre_completo || '',
        rol: user.rol || 'funcionario',
        activo: user.activo ?? true,
      });
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        nombre_completo: '',
        rol: 'funcionario',
        activo: true,
      });
    }
    setError(null);
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEditing) {
        await userService.update(user.id, formData);
      } else {
        if (!formData.password) {
          setError('La contraseña es obligatoria para nuevos usuarios');
          setLoading(false);
          return;
        }
        await userService.create(formData);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f2d1e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={20} color="#2d6a4f" />
            {isEditing ? `Editar Usuario: ${user.username}` : 'Registrar Nuevo Usuario Interno (RF03)'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>Nombre Completo *</label>
            <input
              type="text"
              required
              value={formData.nombre_completo}
              onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
              className="form-input"
              placeholder="Ej. Juan Pérez González"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>Usuario *</label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="form-input"
                placeholder="jperez"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>Rol (RF02) *</label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                className="form-select"
                style={{ width: '100%' }}
              >
                <option value="funcionario">Funcionario Municipal</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>Correo Electrónico *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="form-input"
              placeholder="jperez@losangeles.cl"
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>
              {isEditing ? 'Nueva Contraseña (dejar en blanco para conservar)' : 'Contraseña *'}
            </label>
            <input
              type="password"
              required={!isEditing}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          {isEditing && (
            <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              />
              <label htmlFor="activo" style={{ fontSize: '0.88rem', fontWeight: '500', cursor: 'pointer' }}>
                Usuario Activo
              </label>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              <Save size={16} />
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Usuario')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

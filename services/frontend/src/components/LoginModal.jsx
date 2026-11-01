import React, { useState } from 'react';
import { X, LogIn, AlertCircle, Shield, KeyRound, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginModal = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(identifier, password);
    setLoading(false);

    if (res.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError(res.error);
    }
  };

  const handleDemoFill = (role) => {
    if (role === 'admin') {
      setIdentifier('admin@losangeles.cl');
      setPassword('AdminPassword123!');
    } else {
      setIdentifier('funcionario@losangeles.cl');
      setPassword('Funcionario123!');
    }
    setError(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} color="#2d6a4f" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f2d1e' }}>
                Acceso Funcionarios
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Autenticación y Control de Roles (RF01)
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.35rem' }}>
              Correo electrónico o Nombre de usuario
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="usuario@losangeles.cl o admin"
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.35rem' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '0.7rem', fontSize: '0.95rem', marginBottom: '1rem' }}
          >
            <LogIn size={18} />
            {loading ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
          </button>

          {/* Quick Demo Access Pills */}
          <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Credenciales de Demostración:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleDemoFill('admin')}
                style={{ flex: 1, padding: '0.35rem 0.6rem', fontSize: '0.76rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', cursor: 'pointer' }}
              >
                👤 Administrador
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('funcionario')}
                style={{ flex: 1, padding: '0.35rem 0.6rem', fontSize: '0.76rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', cursor: 'pointer' }}
              >
                💼 Funcionario
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

import React from 'react';
import { User, KeyRound, LogIn } from 'lucide-react';

export const PasswordLoginTab = ({
  identifier,
  setIdentifier,
  password,
  setPassword,
  loading,
  onSubmit,
  onDemoFill
}) => {
  return (
    <form onSubmit={onSubmit}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.35rem' }}>
          Correo electrónico o Usuario
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
            placeholder="admin o usuario@losangeles.cl"
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
      <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: '600', color: '#64748b', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Credenciales Demo:
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => onDemoFill('admin')}
            style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', cursor: 'pointer' }}
          >
            👤 Admin
          </button>
          <button
            type="button"
            onClick={() => onDemoFill('funcionario')}
            style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', cursor: 'pointer' }}
          >
            💼 Funcionario
          </button>
        </div>
      </div>
    </form>
  );
};

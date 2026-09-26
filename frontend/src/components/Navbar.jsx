import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Landmark, Search, Map, Shield, User, LogIn, LogOut, BookOpen, LayoutDashboard } from 'lucide-react';

export const Navbar = ({ activePage, setActivePage, openLoginModal }) => {
  const { user, role, isAuthenticated, logout, isFuncionario, isAdmin } = useAuth();
  const [quickSearch, setQuickSearch] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      setActivePage({ name: 'search', query: quickSearch.trim() });
    }
  };

  return (
    <header className="navbar">
      <div 
        className="nav-brand" 
        onClick={() => setActivePage({ name: 'home' })}
        style={{ cursor: 'pointer' }}
      >
        <div className="brand-icon-wrapper">
          <Landmark size={24} />
        </div>
        <div>
          <div className="brand-title">Cementerio Municipal</div>
          <div className="brand-subtitle">Sistema de Información Geográfica • Los Ángeles</div>
        </div>
      </div>

      <nav className="nav-links">
        <button 
          className={`nav-link ${activePage.name === 'home' ? 'active' : ''}`}
          onClick={() => setActivePage({ name: 'home' })}
        >
          Inicio
        </button>
        <button 
          className={`nav-link ${activePage.name === 'search' ? 'active' : ''}`}
          onClick={() => setActivePage({ name: 'search' })}
        >
          <Search size={16} />
          Buscar sepultura
        </button>
        <button 
          className={`nav-link ${activePage.name === 'map' ? 'active' : ''}`}
          onClick={() => setActivePage({ name: 'map' })}
        >
          <Map size={16} />
          Mapa
        </button>
        <button 
          className={`nav-link ${activePage.name === 'mausoleos' ? 'active' : ''}`}
          onClick={() => setActivePage({ name: 'mausoleos' })}
        >
          <BookOpen size={16} />
          Mausoleos históricos
        </button>
        {isFuncionario && (
          <button 
            className={`nav-link ${activePage.name === 'admin' ? 'active' : ''}`}
            onClick={() => setActivePage({ name: 'admin' })}
          >
            <LayoutDashboard size={16} />
            Administración
          </button>
        )}
      </nav>

      <div className="nav-actions">
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Buscar sepultura..."
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            className="form-input"
            style={{ width: '180px', paddingRight: '2rem', height: '36px', fontSize: '0.84rem' }}
          />
          <Search 
            size={14} 
            style={{ position: 'absolute', right: '10px', top: '11px', color: '#94a3b8' }} 
          />
        </form>

        <div className={`role-badge ${role}`}>
          <User size={14} />
          <span>{role === 'administrador' ? 'Administrador' : (role === 'funcionario' ? 'Funcionario' : 'Público')}</span>
        </div>

        {isAuthenticated ? (
          <button 
            onClick={logout} 
            className="btn-secondary" 
            title="Cerrar sesión"
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        ) : (
          <button 
            onClick={openLoginModal} 
            className="btn-primary"
            style={{ padding: '0.45rem 1.1rem', fontSize: '0.84rem' }}
          >
            <LogIn size={15} />
            Iniciar sesión
          </button>
        )}
      </div>
    </header>
  );
};

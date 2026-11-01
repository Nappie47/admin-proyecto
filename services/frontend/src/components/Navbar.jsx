import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Leaf, Search, Map, User, LogIn, LogOut, BookOpen, LayoutDashboard, Home, Menu, X, TreePine } from 'lucide-react';

export const Navbar = ({ activePage, setActivePage, openLoginModal }) => {
  const { role, isAuthenticated, logout, isFuncionario } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header className="navbar">
        <button
          type="button"
          className="mobile-menu-button"
          aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <button
          type="button"
          className="nav-brand"
          onClick={() => {
            setActivePage({ name: 'home' });
            setSidebarOpen(false);
          }}
        >
          <span className="brand-icon-wrapper"><Leaf size={24} /></span>
          <span>
            <span className="brand-title">Cementerio Municipal</span>
            <span className="brand-subtitle">Sistema de Información Geográfica</span>
          </span>
        </button>

        <div className="nav-actions">
          <button
            type="button"
            className="nav-icon-button"
            aria-label="Buscar sepultura"
            onClick={() => setActivePage({ name: 'search' })}
          >
            <Search size={20} />
          </button>
          <div className={`role-badge ${role}`}>
            <User size={16} />
            <span>{role === 'administrador' ? 'Administrador' : (role === 'funcionario' ? 'Funcionario' : 'Público')}</span>
          </div>
          {isAuthenticated ? (
            <button onClick={logout} className="btn-primary nav-session-button" title="Cerrar sesión">
              <LogOut size={15} />
              Cerrar sesión
            </button>
          ) : (
            <button onClick={openLoginModal} className="btn-primary nav-session-button">
              <LogIn size={15} />
              Iniciar sesión
            </button>
          )}
        </div>
      </header>

      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <nav className="sidebar-links" aria-label="Navegación principal">
          <button className={`nav-link ${activePage.name === 'home' ? 'active' : ''}`} onClick={() => { setActivePage({ name: 'home' }); setSidebarOpen(false); }}>
            <Home size={19} /> Inicio
          </button>
          <button className={`nav-link ${activePage.name === 'search' ? 'active' : ''}`} onClick={() => { setActivePage({ name: 'search' }); setSidebarOpen(false); }}>
            <Search size={19} /> Buscar sepultura
          </button>
          <button className={`nav-link ${activePage.name === 'map' ? 'active' : ''}`} onClick={() => { setActivePage({ name: 'map' }); setSidebarOpen(false); }}>
            <Map size={19} /> Mapa
          </button>
          <button className={`nav-link ${activePage.name === 'mausoleos' ? 'active' : ''}`} onClick={() => { setActivePage({ name: 'mausoleos' }); setSidebarOpen(false); }}>
            <BookOpen size={19} /> Mausoleos históricos
          </button>
          {isFuncionario && (
            <button className={`nav-link ${activePage.name === 'admin' ? 'active' : ''}`} onClick={() => { setActivePage({ name: 'admin' }); setSidebarOpen(false); }}>
              <LayoutDashboard size={19} /> Administración
            </button>
          )}
        </nav>
        <div className="sidebar-memory">
          <TreePine size={42} strokeWidth={1.35} />
          <span>Memoria que<br />nos une</span>
          <i />
        </div>
      </aside>
      {sidebarOpen && <button type="button" className="sidebar-backdrop" aria-label="Cerrar menú" onClick={() => setSidebarOpen(false)} />}
    </>
  );
};

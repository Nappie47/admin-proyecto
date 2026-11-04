import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sepulturaService, userService, patioService } from '../services/api';
import { GraveModal } from '../components/GraveModal';
import { UserModal } from '../components/UserModal';
import { AdminStatsCards } from '../components/admin/AdminStatsCards';
import { SepulturasTab } from '../components/admin/SepulturasTab';
import { PatiosTab } from '../components/admin/PatiosTab';
import { UsersTab } from '../components/admin/UsersTab';
import '../components/admin/AdminDashboard.css';

export const AdminDashboard = ({ initialTab, setActivePage }) => {
  const { user, isAdmin, isFuncionario, loading } = useAuth();

  // Redirigir a inicio si no es funcionario o cierra sesión
  useEffect(() => {
    if (!loading && !isFuncionario) {
      setActivePage({ name: 'home' });
    }
  }, [loading, isFuncionario, setActivePage]);

  const [activeTab, setActiveTab] = useState('sepulturas'); // 'sepulturas', 'usuarios', 'patios'
  const [stats, setStats] = useState({
    total_sepulturas: 0,
    disponibles: 0,
    ocupadas: 0,
    pct_disponibles: 0,
    pct_ocupadas: 0,
    mausoleos_historicos: 0
  });

  // Sepulturas State
  const [sepulturas, setSepulturas] = useState([]);
  const [totalSepulturas, setTotalSepulturas] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPatio, setFilterPatio] = useState('Todos');
  const [filterTipo, setFilterTipo] = useState('Todos');
  const [filterEstado, setFilterEstado] = useState('Todos');

  // Users State
  const [usersList, setUsersList] = useState([]);

  // Patios State
  const [patiosList, setPatiosList] = useState([]);
  const [patiosLoading, setPatiosLoading] = useState(true);
  const [patiosError, setPatiosError] = useState(null);

  // Modals state
  const [isGraveModalOpen, setIsGraveModalOpen] = useState(false);
  const [editingGrave, setEditingGrave] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [notification, setNotification] = useState(null);

  // Load stats
  const fetchStats = async () => {
    try {
      const res = await sepulturaService.stats();
      if (res.data.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  };

  // Load patios
  const fetchPatios = async () => {
    setPatiosLoading(true);
    setPatiosError(null);
    try {
      const res = await patioService.list();
      if (res.data.success) {
        setPatiosList(res.data.patios);
      } else {
        throw new Error(res.data.error || 'No se pudo confirmar la lista de patios.');
      }
    } catch (err) {
      console.error('Error cargando patios:', err);
      setPatiosError(err.response?.data?.error || err.message || 'No se pudieron cargar los patios. Revisa la conexión con el backend.');
    } finally {
      setPatiosLoading(false);
    }
  };

  // Load sepulturas table
  const fetchSepulturas = async (page = 1) => {
    try {
      const params = {
        page,
        per_page: 8,
      };
      if (searchTerm.trim()) params.q = searchTerm.trim();
      if (filterPatio !== 'Todos') params.patio = filterPatio;
      if (filterTipo !== 'Todos') params.tipo = filterTipo;
      if (filterEstado !== 'Todos') params.estado = filterEstado;

      const res = await sepulturaService.list(params);
      if (res.data.success) {
        setSepulturas(res.data.sepulturas);
        setTotalSepulturas(res.data.total);
        setTotalPages(res.data.pages || 1);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error('Error cargando sepulturas:', err);
    }
  };

  // Load users
  const fetchUsers = async () => {
    if (!isAdmin) return;
    try {
      const res = await userService.list();
      if (res.data.success) {
        setUsersList(res.data.users);
      }
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    }
  };

  const handleDeletePatio = async (id, numero) => {
    if (!window.confirm(`¿Está seguro de eliminar el Patio ${numero}?`)) return;
    try {
      await patioService.delete(id);
      setNotification({ type: 'success', message: `Patio ${numero} eliminado exitosamente.` });
      fetchPatios();
      fetchStats();
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.error || 'Error eliminando patio' });
    }
  };

  useEffect(() => {
    if (!isFuncionario) return;
    fetchStats();
    fetchPatios();
    fetchSepulturas(1);
    if (isAdmin) fetchUsers();
  }, [filterPatio, filterTipo, filterEstado, isFuncionario, isAdmin]);

  useEffect(() => {
    if (!isFuncionario) return;
    if (initialTab && ['sepulturas', 'usuarios', 'patios'].includes(initialTab)) {
      setActiveTab(initialTab);
      if (initialTab === 'usuarios' && isAdmin) fetchUsers();
      if (initialTab === 'patios') fetchPatios();
    }
  }, [initialTab, isFuncionario, isAdmin]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSepulturas(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterPatio('Todos');
    setFilterTipo('Todos');
    setFilterEstado('Todos');
    sepulturaService.list({ page: 1, per_page: 8 }).then(res => {
      if (res.data.success) {
        setSepulturas(res.data.sepulturas);
        setTotalSepulturas(res.data.total);
        setTotalPages(res.data.pages || 1);
        setCurrentPage(1);
      }
    });
  };

  const handleDeleteGrave = async (id, numero) => {
    if (window.confirm(`¿Está seguro de desactivar la sepultura #${numero}?`)) {
      try {
        await sepulturaService.delete(id);
        setNotification({ type: 'success', message: `Sepultura #${numero} desactivada correctamente.` });
        fetchStats();
        fetchSepulturas(currentPage);
      } catch (err) {
        setNotification({ type: 'error', message: 'Error al desactivar la sepultura.' });
      }
    }
  };

  const handleDeactivateUser = async (id, username) => {
    if (window.confirm(`¿Está seguro de desactivar al usuario ${username}?`)) {
      try {
        await userService.delete(id);
        setNotification({ type: 'success', message: `Usuario ${username} desactivado.` });
        fetchUsers();
      } catch (err) {
        setNotification({ type: 'error', message: 'Error al desactivar el usuario.' });
      }
    }
  };

  if (!isFuncionario) {
    return null;
  }

  return (
    <div className="admin-dashboard">
      {/* Top Banner & Header */}
      <div className="admin-header">
        <div>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Administración
          </span>
          <h1>Panel administrativo</h1>
          <p>Gestiona la información del cementerio de manera eficiente y segura.</p>
        </div>

        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: '300px' }}>
          <div style={{ fontSize: '1.5rem' }}>🏛️</div>
          <div style={{ fontSize: '0.8rem', color: '#166534', lineHeight: '1.4' }}>
            Un espacio de memoria y patrimonio para nuestra comunidad.
          </div>
        </div>
      </div>

      {notification && (
        <div className={`admin-notification ${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
        </div>
      )}

      {/* 4 Stats Cards */}
      <AdminStatsCards stats={stats} />

      {/* Tabs navigation */}
      <div className="admin-tabs-nav">
        <button
          onClick={() => setActiveTab('sepulturas')}
          className={`admin-tab-btn ${activeTab === 'sepulturas' ? 'active' : ''}`}
        >
          Sepulturas
        </button>

        <button
          onClick={() => { setActiveTab('patios'); fetchPatios(); }}
          className={`admin-tab-btn ${activeTab === 'patios' ? 'active' : ''}`}
        >
          Patios Topográficos ({patiosList.length})
        </button>

        {isAdmin && (
          <button
            onClick={() => { setActiveTab('usuarios'); fetchUsers(); }}
            className={`admin-tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`}
          >
            Usuarios Internos
          </button>
        )}
      </div>

      {/* Active Tab View */}
      {activeTab === 'sepulturas' && (
        <SepulturasTab
          sepulturas={sepulturas}
          totalSepulturas={totalSepulturas}
          currentPage={currentPage}
          totalPages={totalPages}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterPatio={filterPatio}
          setFilterPatio={setFilterPatio}
          filterTipo={filterTipo}
          setFilterTipo={setFilterTipo}
          filterEstado={filterEstado}
          setFilterEstado={setFilterEstado}
          patiosList={patiosList}
          onSearchSubmit={handleSearchSubmit}
          onClearFilters={handleClearFilters}
          onPageChange={fetchSepulturas}
          onAddGrave={() => { setEditingGrave(null); setIsGraveModalOpen(true); }}
          onEditGrave={(grave) => { setEditingGrave(grave); setIsGraveModalOpen(true); }}
          onDeleteGrave={handleDeleteGrave}
        />
      )}

      {activeTab === 'patios' && (
        <PatiosTab
          patiosList={patiosList}
          patiosLoading={patiosLoading}
          patiosError={patiosError}
          onRetry={fetchPatios}
          onOpenMapEditor={(patioId) => {
            setActivePage({ name: 'map', openEditor: true, ...(patioId ? { selectedPatioId: patioId } : {}) });
          }}
          onDeletePatio={handleDeletePatio}
        />
      )}

      {activeTab === 'usuarios' && isAdmin && (
        <UsersTab
          usersList={usersList}
          onAddUser={() => { setEditingUser(null); setIsUserModalOpen(true); }}
          onEditUser={(userItem) => { setEditingUser(userItem); setIsUserModalOpen(true); }}
          onDeactivateUser={handleDeactivateUser}
        />
      )}

      {/* Grave Modal */}
      <GraveModal
        isOpen={isGraveModalOpen}
        onClose={() => setIsGraveModalOpen(false)}
        sepultura={editingGrave}
        patios={patiosList}
        patiosLoading={patiosLoading}
        patiosError={patiosError}
        onRetryPatios={fetchPatios}
        onCreatePatio={() => {
          setIsGraveModalOpen(false);
          setActivePage({ name: 'map', openEditor: true });
        }}
        onSaved={() => {
          fetchStats();
          fetchSepulturas(currentPage);
          setNotification({ type: 'success', message: 'Sepultura guardada exitosamente.' });
        }}
      />

      {/* User Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        user={editingUser}
        onSaved={() => {
          fetchUsers();
          setNotification({ type: 'success', message: 'Usuario guardado exitosamente.' });
        }}
      />
    </div>
  );
};

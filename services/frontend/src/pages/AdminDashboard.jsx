import React, { useState, useEffect } from 'react';
import { 
  Users, Layers, Landmark, BarChart2, Settings, Plus, Search, 
  RotateCcw, Edit2, Trash2, CheckCircle2, AlertTriangle, ShieldCheck, UserPlus,
  Map, Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sepulturaService, userService, mausoleoService, patioService } from '../services/api';
import { GraveModal } from '../components/GraveModal';
import { UserModal } from '../components/UserModal';

export const AdminDashboard = ({ initialTab, setActivePage }) => {
  const { user, isAdmin, isFuncionario } = useAuth();

  const [activeTab, setActiveTab] = useState('sepulturas'); // 'sepulturas', 'usuarios', 'mausoleos'
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

  // Users State (RF03)
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

  // Load users (RF03)
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
    fetchStats();
    fetchPatios();
    fetchSepulturas(1);
    if (isAdmin) fetchUsers();
  }, [filterPatio, filterTipo, filterEstado]);

  useEffect(() => {
    if (initialTab && ['sepulturas', 'usuarios', 'patios'].includes(initialTab)) {
      setActiveTab(initialTab);
      if (initialTab === 'usuarios') fetchUsers();
      if (initialTab === 'patios') fetchPatios();
    }
  }, [initialTab]);

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
    if (window.confirm(`¿Está seguro de desactivar la sepultura #${numero}? (RF06)`)) {
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
    if (window.confirm(`¿Está seguro de desactivar al usuario ${username}? (RF03)`)) {
      try {
        await userService.delete(id);
        setNotification({ type: 'success', message: `Usuario ${username} desactivado.` });
        fetchUsers();
      } catch (err) {
        setNotification({ type: 'error', message: 'Error al desactivar el usuario.' });
      }
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Top Banner & Header (Slide 9 Mockup) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Administración
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f2d1e', margin: '0.2rem 0 0.5rem 0' }}>
            Panel administrativo
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Gestiona la información del cementerio de manera eficiente y segura.
          </p>
        </div>

        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: '300px' }}>
          <div style={{ fontSize: '1.5rem' }}>🏛️</div>
          <div style={{ fontSize: '0.8rem', color: '#166534', lineHeight: '1.4' }}>
            Un espacio de memoria y patrimonio para nuestra comunidad.
          </div>
        </div>
      </div>

      {notification && (
        <div style={{ 
          backgroundColor: notification.type === 'success' ? '#f0fdf4' : '#fef2f2', 
          border: `1px solid ${notification.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: notification.type === 'success' ? '#166534' : '#991b1b',
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
        </div>
      )}

      {/* 4 Stats Cards (Slide 9 Mockup) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {/* Card 1: Total */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✝
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total de sepulturas</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f2d1e' }}>{stats.total_sepulturas}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>En la muestra del piloto</div>
        </div>

        {/* Card 2: Disponibles */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Sepulturas disponibles</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0284c7' }}>{stats.disponibles}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: '600' }}>
            {stats.pct_disponibles}% del total
          </div>
        </div>

        {/* Card 3: Ocupadas */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
              ✝
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Sepulturas ocupadas</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#166534' }}>{stats.ocupadas}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: '600' }}>
            {stats.pct_ocupadas}% del total
          </div>
        </div>

        {/* Card 4: Mausoleos */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}>
              🏛
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Mausoleos históricos</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#b45309' }}>{stats.mausoleos_historicos}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>En la muestra cargada</div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('sepulturas')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'sepulturas' ? '#2d6a4f' : 'transparent',
            color: activeTab === 'sepulturas' ? 'white' : '#64748b',
            fontWeight: '600',
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}
        >
          Sepulturas
        </button>

        <button
          onClick={() => { setActiveTab('patios'); fetchPatios(); }}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'patios' ? '#2d6a4f' : 'transparent',
            color: activeTab === 'patios' ? 'white' : '#64748b',
            fontWeight: '600',
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}
        >
          Patios Topográficos ({patiosList.length})
        </button>

        {isAdmin && (
          <button
            onClick={() => { setActiveTab('usuarios'); fetchUsers(); }}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'usuarios' ? '#2d6a4f' : 'transparent',
              color: activeTab === 'usuarios' ? 'white' : '#64748b',
              fontWeight: '600',
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            Usuarios Internos (RF03)
          </button>
        )}
      </div>

      {activeTab === 'sepulturas' && (
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          {/* Table Toolbar Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f2d1e', margin: 0 }}>
                Listado de sepulturas
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Consulta, filtra y administra las sepulturas incluidas en la muestra del piloto.
              </p>
            </div>

            <button
              onClick={() => { setEditingGrave(null); setIsGraveModalOpen(true); }}
              className="btn-primary"
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
            >
              <Plus size={18} />
              Agregar sepultura
            </button>
          </div>

          {/* Filters Bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', gridColumn: 'span 2' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Buscar por nombre, apellido o número de sepultura..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
              />
            </div>

            <div>
              <select value={filterPatio} onChange={(e) => setFilterPatio(e.target.value)} className="form-select" style={{ width: '100%' }}>
                <option value="Todos">Patio: Todos</option>
                {patiosList.map(patio => (
                  <option key={patio.id} value={patio.numero}>
                    Patio {patio.numero}{patio.nombre ? ` — ${patio.nombre}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="form-select" style={{ width: '100%' }}>
                <option value="Todos">Tipo: Todos</option>
                <option value="Individual">Individual</option>
                <option value="Familiar">Familiar</option>
                <option value="Nicho">Nicho</option>
                <option value="Mausoleo">Mausoleo</option>
              </select>
            </div>

            <div>
              <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="form-select" style={{ width: '100%' }}>
                <option value="Todos">Estado: Todos</option>
                <option value="Ocupada">Ocupada</option>
                <option value="Disponible">Disponible</option>
                <option value="En Mantenimiento">En Mantenimiento</option>
              </select>
            </div>

            <div>
              <button type="button" onClick={handleClearFilters} className="btn-secondary" style={{ width: '100%', height: '40px', justifyContent: 'center' }}>
                <RotateCcw size={15} />
                Limpiar filtros
              </button>
            </div>
          </form>

          {/* Table */}
          <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Número</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Patio</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Tipo</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Estado</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Nombre</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Fecha de fallecimiento</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sepulturas.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      No hay sepulturas que mostrar en la muestra cargada.
                    </td>
                  </tr>
                ) : sepulturas.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0f2d1e' }}>{s.numero}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>Patio {s.patio_numero}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>{s.tipo}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge-status ${s.estado.toLowerCase().replace(' ', '-')}`}>
                        {s.estado}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: s.estado === 'Ocupada' ? '600' : 'normal' }}>
                      {s.estado === 'Ocupada' ? s.nombre_completo : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                      {s.fecha_fallecimiento || '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => { setEditingGrave(s); setIsGraveModalOpen(true); }}
                          title="Editar sepultura"
                          style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.35rem', cursor: 'pointer', color: '#475569' }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteGrave(s.id, s.numero)}
                          title="Desactivar sepultura"
                          style={{ background: 'none', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.35rem', cursor: 'pointer', color: '#dc2626' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination (Slide 9 Mockup) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
              Mostrando {sepulturas.length > 0 ? (currentPage - 1) * 8 + 1 : 0} a {Math.min(currentPage * 8, totalSepulturas)} de {totalSepulturas} resultados
            </div>

            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                onClick={() => fetchSepulturas(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                &lt; Anterior
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => fetchSepulturas(p)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: currentPage === p ? '#2d6a4f' : '#e2e8f0',
                    backgroundColor: currentPage === p ? '#2d6a4f' : 'white',
                    color: currentPage === p ? 'white' : '#1e293b',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: currentPage === p ? '700' : 'normal'
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => fetchSepulturas(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                Siguiente &gt;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patios Tab (Límites Satelitales y Catastro) */}
      {activeTab === 'patios' && (
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f2d1e', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={20} color="#2d6a4f" />
                Patios Topográficos y Límites
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                Administra los sectores que forman parte de la muestra del proyecto.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setActivePage({ name: 'map', openEditor: true })}
                className="btn-primary"
                style={{ fontSize: '0.84rem' }}
              >
                <Map size={16} />
                Delimitar en mapa
              </button>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Patio</th>
                <th style={{ padding: '0.75rem 1rem' }}>Nombre del Sector</th>
                <th style={{ padding: '0.75rem 1rem' }}>Superficie</th>
                <th style={{ padding: '0.75rem 1rem' }}>Sepulturas</th>
                <th style={{ padding: '0.75rem 1rem' }}>Límites SIG</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {patiosLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Cargando patios...
                  </td>
                </tr>
              ) : patiosError ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#991b1b' }}>
                    <div role="alert">{patiosError}</div>
                    <button
                      type="button"
                      onClick={fetchPatios}
                      className="btn-secondary"
                      style={{ marginTop: '0.75rem' }}
                    >
                      Reintentar
                    </button>
                  </td>
                </tr>
              ) : patiosList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No se han registrado patios en la base de datos.<br />
                    Abre el mapa satelital para delimitar los sectores reales de la muestra.
                  </td>
                </tr>
              ) : (
                patiosList.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: p.color_hex || '#2d6a4f' }} />
                        Patio {p.numero}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: '600', color: '#0f2d1e' }}>{p.nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.descripcion || 'Sin descripción'}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                      {p.superficie_m2 ? `${p.superficie_m2} m²` : 'N/A'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="badge-status ocupada">{p.total_sepulturas || 0} registradas</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {p.geometry ? (
                        <span style={{ color: '#166534', fontWeight: '600', fontSize: '0.8rem' }}>✓ Delimitado (Polígono)</span>
                      ) : (
                        <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>Sin geometría</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => setActivePage({ name: 'map', openEditor: true, selectedPatioId: p.id })}
                          title="Editar en el mapa interactivo"
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                        >
                          <Map size={14} />
                          Editar en Mapa
                        </button>
                        <button
                          onClick={() => handleDeletePatio(p.id, p.numero)}
                          title="Eliminar patio"
                          style={{ background: 'none', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.35rem', cursor: 'pointer', color: '#dc2626' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Users Tab (RF03 - Admin Only) */}
      {activeTab === 'usuarios' && isAdmin && (
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f2d1e', margin: 0 }}>
                Gestión de Usuarios Internos (RF03)
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Administra funcionarios municipales autorizados para el catastro y edición.
              </p>
            </div>

            <button
              onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
              className="btn-primary"
            >
              <UserPlus size={16} />
              Crear Nuevo Usuario
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Nombre Completo</th>
                <th style={{ padding: '0.75rem 1rem' }}>Usuario</th>
                <th style={{ padding: '0.75rem 1rem' }}>Correo</th>
                <th style={{ padding: '0.75rem 1rem' }}>Rol</th>
                <th style={{ padding: '0.75rem 1rem' }}>Estado</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>{u.nombre_completo}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>{u.username}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{u.email}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={`role-badge ${u.rol}`}>{u.rol}</span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ color: u.activo ? '#166534' : '#991b1b', fontWeight: '600', fontSize: '0.82rem' }}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }}
                        style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.35rem', cursor: 'pointer' }}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeactivateUser(u.id, u.username)}
                        style={{ background: 'none', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.35rem', cursor: 'pointer', color: '#dc2626' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

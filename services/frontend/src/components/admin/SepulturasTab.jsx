import React from 'react';
import { Plus, Search, RotateCcw, Edit2, Trash2 } from 'lucide-react';

export const SepulturasTab = ({
  sepulturas,
  totalSepulturas,
  currentPage,
  totalPages,
  searchTerm,
  setSearchTerm,
  filterPatio,
  setFilterPatio,
  filterTipo,
  setFilterTipo,
  filterEstado,
  setFilterEstado,
  patiosList,
  onSearchSubmit,
  onClearFilters,
  onPageChange,
  onAddGrave,
  onEditGrave,
  onDeleteGrave
}) => {
  return (
    <div className="admin-tab-panel">
      {/* Table Toolbar Header */}
      <div className="admin-tab-toolbar">
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f2d1e', margin: 0 }}>
            Listado de sepulturas
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
            Consulta, filtra y administra las sepulturas incluidas en la muestra del piloto.
          </p>
        </div>

        <button
          onClick={onAddGrave}
          className="btn-primary"
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
        >
          <Plus size={18} />
          Agregar sepultura
        </button>
      </div>

      {/* Filters Bar */}
      <form onSubmit={onSearchSubmit} className="admin-filters-grid">
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
          <button type="button" onClick={onClearFilters} className="btn-secondary" style={{ width: '100%', height: '40px', justifyContent: 'center' }}>
            <RotateCcw size={15} />
            Limpiar filtros
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Patio</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Nombre</th>
              <th>Fecha de fallecimiento</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
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
              <tr key={s.id}>
                <td style={{ fontWeight: '700', color: '#0f2d1e' }}>{s.numero}</td>
                <td>Patio {s.patio_numero}</td>
                <td>{s.tipo}</td>
                <td>
                  <span className={`badge-status ${s.estado.toLowerCase().replace(' ', '-')}`}>
                    {s.estado}
                  </span>
                </td>
                <td style={{ fontWeight: s.estado === 'Ocupada' ? '600' : 'normal' }}>
                  {s.estado === 'Ocupada' ? s.nombre_completo : '—'}
                </td>
                <td style={{ color: '#64748b' }}>
                  {s.fecha_fallecimiento || '—'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => onEditGrave(s)}
                      title="Editar sepultura"
                      style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.35rem', cursor: 'pointer', color: '#475569' }}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => onDeleteGrave(s.id, s.numero)}
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

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
          Mostrando {sepulturas.length > 0 ? (currentPage - 1) * 8 + 1 : 0} a {Math.min(currentPage * 8, totalSepulturas)} de {totalSepulturas} resultados
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
          >
            &lt; Anterior
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
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
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
          >
            Siguiente &gt;
          </button>
        </div>
      </div>
    </div>
  );
};


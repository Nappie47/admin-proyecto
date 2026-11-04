import React from 'react';
import { Database, Map, Trash2 } from 'lucide-react';

export const PatiosTab = ({
  patiosList,
  patiosLoading,
  patiosError,
  onRetry,
  onOpenMapEditor,
  onDeletePatio
}) => {
  return (
    <div className="admin-tab-panel">
      <div className="admin-tab-toolbar">
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
            onClick={() => onOpenMapEditor()}
            className="btn-primary"
            style={{ fontSize: '0.84rem' }}
          >
            <Map size={16} />
            Delimitar en mapa
          </button>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table" style={{ minWidth: '600px' }}>
          <thead>
            <tr>
              <th>Patio</th>
              <th>Nombre del Sector</th>
              <th>Superficie</th>
              <th>Sepulturas</th>
              <th>Límites SIG</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
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
                    onClick={onRetry}
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
                <tr key={p.id}>
                  <td style={{ fontWeight: '700' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: p.color_hex || '#2d6a4f' }} />
                      Patio {p.numero}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', color: '#0f2d1e' }}>{p.nombre}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.descripcion || 'Sin descripción'}</div>
                  </td>
                  <td style={{ color: '#475569' }}>
                    {p.superficie_m2 ? `${p.superficie_m2} m²` : 'N/A'}
                  </td>
                  <td>
                    <span className="badge-status ocupada">{p.total_sepulturas || 0} registradas</span>
                  </td>
                  <td>
                    {p.geometry ? (
                      <span style={{ color: '#166534', fontWeight: '600', fontSize: '0.8rem' }}>✓ Delimitado (Polígono)</span>
                    ) : (
                      <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>Sin geometría</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => onOpenMapEditor(p.id)}
                        title="Editar en el mapa interactivo"
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                      >
                        <Map size={14} />
                        Editar en Mapa
                      </button>
                      <button
                        onClick={() => onDeletePatio(p.id, p.numero)}
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
    </div>
  );
};


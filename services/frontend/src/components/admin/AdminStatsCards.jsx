import React from 'react';

export const AdminStatsCards = ({ stats }) => {
  return (
    <div className="admin-stats-grid">
      {/* Card 1: Total */}
      <div className="admin-stat-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div className="admin-stat-icon-wrapper" style={{ backgroundColor: '#f1f5f9' }}>
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
      <div className="admin-stat-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div className="admin-stat-icon-wrapper" style={{ backgroundColor: '#e0f2fe' }}>
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
      <div className="admin-stat-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div className="admin-stat-icon-wrapper" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
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
      <div className="admin-stat-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div className="admin-stat-icon-wrapper" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
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
  );
};

import React from 'react';
import { UserPlus, Camera, Edit2, Trash2 } from 'lucide-react';

export const UsersTab = ({
  usersList,
  onAddUser,
  onEditUser,
  onDeactivateUser
}) => {
  return (
    <div className="admin-tab-panel">
      <div className="admin-tab-toolbar">
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f2d1e', margin: 0 }}>
            Gestión de Usuarios Internos
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
            Administra funcionarios municipales autorizados para el catastro y edición.
          </p>
        </div>

        <button
          onClick={onAddUser}
          className="btn-primary"
        >
          <UserPlus size={16} />
          Crear Nuevo Usuario
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table" style={{ minWidth: '600px' }}>
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Biometría IA</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usersList.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: '600' }}>{u.nombre_completo}</td>
                <td>{u.username}</td>
                <td style={{ color: '#64748b' }}>{u.email}</td>
                <td>
                  <span className={`role-badge ${u.rol}`}>{u.rol}</span>
                </td>
                <td>
                  {u.has_biometrics ? (
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.3rem', 
                      backgroundColor: '#dcfce7', 
                      color: '#15803d', 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.74rem', 
                      fontWeight: '600' 
                    }}>
                      <Camera size={12} />
                      Enrolado
                    </span>
                  ) : (
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.3rem', 
                      backgroundColor: '#f1f5f9', 
                      color: '#64748b', 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.74rem', 
                      fontWeight: '500' 
                    }}>
                      Sin enrolar
                    </span>
                  )}
                </td>
                <td>
                  <span style={{ color: u.activo ? '#166534' : '#991b1b', fontWeight: '600', fontSize: '0.82rem' }}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => onEditUser(u)}
                      style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.35rem', cursor: 'pointer' }}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => onDeactivateUser(u.id, u.username)}
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
    </div>
  );
};

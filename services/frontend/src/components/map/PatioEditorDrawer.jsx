import React from 'react';
import { Database, X, Undo2, RefreshCw, Save, Plus, Edit3, Trash2 } from 'lucide-react';

export const PatioEditorDrawer = ({
  isOpen,
  onClose,
  editingPatio,
  onCancelEdit,
  drawingPoints,
  onUndoPoint,
  onClearPoints,
  formData,
  setFormData,
  colorPresets,
  onSavePatio,
  isSaving,
  patios,
  onStartCreatePatio,
  onStartEditPatio,
  onDeletePatio
}) => {
  if (!isOpen) return null;

  return (
    <div className="map-drawer-panel">
      {/* Editor Header */}
      <div className="map-drawer-header">
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f2d1e', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={17} color="#2d6a4f" />
            Editor de Patios & Límites
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Los cambios se guardan en la base de datos configurada.
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Editor Body */}
      <div className="map-drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="map-editor-hint">
          <strong>Delimita sectores reales</strong>
          <span>Usa la imagen satelital para identificar el perímetro. Los cambios solo se guardan al confirmar el formulario.</span>
        </div>

        {/* Si estamos creando o editando un patio */}
        {editingPatio ? (
          <form onSubmit={onSavePatio} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ fontWeight: '700', color: '#1b4332', fontSize: '0.9rem' }}>
                {editingPatio.id ? `Modificar Patio ${formData.numero}` : 'Nuevo Patio'}
              </span>
              <button
                type="button"
                onClick={onCancelEdit}
                className="btn-secondary"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
              >
                Cancelar
              </button>
            </div>

            {/* Instrucciones de Dibujo */}
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.65rem', fontSize: '0.76rem', color: '#1e40af' }}>
              <strong>Modo dibujo:</strong> Haz clic sobre el mapa para marcar los vértices del perímetro. Haz zoom para ubicar cada esquina con precisión.
              <div style={{ marginTop: '0.35rem', fontWeight: '700' }}>
                Vértices marcados: {drawingPoints.length} {drawingPoints.length >= 3 ? '✓ (mínimo alcanzado; se valida al guardar)' : '(Mínimo 3)'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={onUndoPoint}
                disabled={drawingPoints.length === 0}
                className="btn-secondary"
                style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem' }}
              >
                <Undo2 size={13} />
                Deshacer punto
              </button>
              <button
                type="button"
                onClick={onClearPoints}
                disabled={drawingPoints.length === 0}
                className="btn-secondary"
                style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem' }}
              >
                Limpiar todo
              </button>
            </div>

            {/* Campos del Formulario */}
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <div style={{ width: '90px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                  Número
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  required
                  className="form-input"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  style={{ height: '34px', fontSize: '0.84rem' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                  Superficie (m²)
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Ej: 4500"
                  value={formData.superficie_m2}
                  onChange={(e) => setFormData({ ...formData, superficie_m2: e.target.value })}
                  style={{ height: '34px', fontSize: '0.84rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                Nombre del Patio
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Patio 1 - Acceso Histórico"
                className="form-input"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                style={{ height: '34px', fontSize: '0.84rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                Descripción / Sector
              </label>
              <textarea
                rows={2}
                className="form-input"
                placeholder="Breve reseña del sector o patio..."
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                style={{ fontSize: '0.8rem', resize: 'vertical' }}
              />
            </div>

            {/* Selector de color */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                Color del Polígono
              </label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {colorPresets.map(col => (
                  <div
                    key={col}
                    onClick={() => setFormData({ ...formData, color_hex: col })}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      backgroundColor: col,
                      cursor: 'pointer',
                      border: formData.color_hex === col ? '2px solid black' : '1px solid rgba(0,0,0,0.15)',
                      transform: formData.color_hex === col ? 'scale(1.15)' : 'none'
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={formData.color_hex}
                  onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                  style={{ width: '32px', height: '26px', padding: 0, border: 'none', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Botón Guardar en DB */}
            <button
              type="submit"
              disabled={isSaving || drawingPoints.length < 3}
              className="btn-primary"
              style={{ marginTop: '0.5rem', justifyContent: 'center', height: '38px', fontSize: '0.85rem' }}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={15} />
                  Guardar en la base de datos
                </>
              )}
            </button>
          </form>
        ) : (
          /* Lista de Patios Existentes */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>
                Patios en Base de Datos ({patios.length})
              </span>
              <button
                type="button"
                onClick={onStartCreatePatio}
                className="btn-primary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              >
                <Plus size={14} />
                Crear Patio
              </button>
            </div>

            {patios.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '0.82rem' }}>
                No hay sectores dibujados todavía.<br />
                Usa “Crear patio” para comenzar a delimitar la muestra.
              </div>
            ) : (
              patios.map(p => (
                <div
                  key={p.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    backgroundColor: '#fafafa',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: p.color_hex || '#2d6a4f' }} />
                      <strong style={{ fontSize: '0.85rem', color: '#0f2d1e' }}>
                        Patio {p.numero}: {p.nombre}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button
                        onClick={() => onStartEditPatio(p)}
                        title="Editar límites satelitales"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', padding: '2px' }}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => onDeletePatio(p)}
                        title="Eliminar patio de la base de datos"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {p.descripcion || 'Sin descripción'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#475569', borderTop: '1px solid #f1f5f9', paddingTop: '0.3rem' }}>
                    <span>Superficie: {p.superficie_m2} m²</span>
                    <span>Sepulturas: {p.total_sepulturas || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};


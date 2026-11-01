import React, { useState, useEffect } from 'react';
import { BookOpen, MapPin, Landmark, Calendar, Sparkles, User, ArrowRight } from 'lucide-react';
import { mausoleoService } from '../services/api';

export const MausoleumsPage = ({ setActivePage }) => {
  const [mausoleos, setMausoleos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mausoleoService.list()
      .then(res => {
        if (res.data.success) {
          setMausoleos(res.data.mausoleos);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#fef3c7', padding: '0.3rem 0.8rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: '700', color: '#b45309', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <Sparkles size={14} />
          Catastro Histórico y Patrimonial (RF12)
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f2d1e', margin: '0 0 0.5rem 0' }}>
          Mausoleos Emblemáticos de Los Ángeles
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#64748b', maxWidth: '750px', lineHeight: '1.6' }}>
          El Cementerio General de Los Ángeles alberga monumentos funerarios que testimonian la historia republicana, la arquitectura neoclásica y moderna, y la memoria colectiva de las familias fundadoras de la provincia de Biobío.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
          Cargando catálogo patrimonial...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
          {mausoleos.map((m) => (
            <div
              key={m.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.04)';
              }}
            >
              {/* Image Banner */}
              <div style={{ height: '200px', position: 'relative', backgroundColor: '#e2e8f0' }}>
                <img
                  src={m.foto_url || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80"}
                  alt={m.nombre}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {m.destacado && (
                  <span style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#b45309', color: 'white', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Destacado
                  </span>
                )}
                {m.ano_construccion && (
                  <span style={{ position: 'absolute', bottom: '12px', left: '12px', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', color: 'white', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                    Año {m.ano_construccion}
                  </span>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f2d1e', marginBottom: '0.5rem', lineHeight: '1.3' }}>
                    {m.nombre}
                  </h3>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
                    {m.estilo_arquitectonico && (
                      <span style={{ backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        🏛 {m.estilo_arquitectonico}
                      </span>
                    )}
                    {m.arquitecto && (
                      <span style={{ backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        ✏️ {m.arquitecto}
                      </span>
                    )}
                    <span style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      📍 Patio {m.patio_numero || 1}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                    {m.resena_historica}
                  </p>
                </div>

                <button
                  onClick={() => setActivePage({ name: 'map', selectedGraveId: `m-${m.id}` })}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <MapPin size={16} />
                  Ver ubicación en el mapa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

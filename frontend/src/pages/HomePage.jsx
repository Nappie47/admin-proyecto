import React, { useState, useEffect } from 'react';
import { Search, Map, BookOpen, Info, ArrowRight, Sparkles, MapPin, Landmark } from 'lucide-react';
import { sepulturaService, mausoleoService, patioService } from '../services/api';

export const HomePage = ({ setActivePage }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredMausoleo, setFeaturedMausoleo] = useState(null);
  const [patios, setPatios] = useState([]);

  useEffect(() => {
    // Load featured historical mausoleum
    mausoleoService.list({ destacado: true }).then(res => {
      if (res.data.success && res.data.mausoleos.length > 0) {
        setFeaturedMausoleo(res.data.mausoleos[0]);
      }
    }).catch(console.error);

    // Load patios
    patioService.list().then(res => {
      if (res.data.success) {
        setPatios(res.data.patios);
      }
    }).catch(console.error);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActivePage({ name: 'search', query: searchQuery.trim() });
    } else {
      setActivePage({ name: 'search' });
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Hero Welcome Banner (Slide 7 Left Mockup) */}
      <section style={{ 
        position: 'relative', 
        borderRadius: '20px', 
        overflow: 'hidden', 
        background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 60%, #40916c 100%)', 
        color: 'white', 
        padding: '3.5rem 3rem',
        marginBottom: '2.5rem',
        boxShadow: '0 12px 30px -5px rgba(27, 67, 50, 0.3)'
      }}>
        <div style={{ maxWidth: '680px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
            <Sparkles size={14} color="#74c69d" />
            Bienvenido al portal municipal
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1.15', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Cementerio Municipal
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#e2e8f0', lineHeight: '1.6', marginBottom: '2rem' }}>
            Un espacio de memoria y patrimonio para nuestra comunidad. Consulta la ubicación de sepulturas, explora nuestro catastro histórico y accede a información geográfica de manera rápida y sencilla.
          </p>

          {/* Quick Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', maxWidth: '580px', backgroundColor: 'white', padding: '0.4rem', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, paddingLeft: '0.75rem' }}>
              <Search size={18} color="#94a3b8" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, apellido o número de sepultura..."
                style={{ border: 'none', outline: 'none', padding: '0.6rem 0.75rem', width: '100%', fontSize: '0.92rem', color: '#1e293b' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '0.65rem 1.5rem', borderRadius: '8px' }}>
              Buscar
            </button>
          </form>
        </div>

        {/* Decorative quote badge */}
        <div style={{ position: 'absolute', right: '3rem', top: '3rem', display: 'none', md: 'block' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', padding: '1.25rem', borderRadius: '16px', maxWidth: '240px', textAlign: 'center' }}>
            <div style={{ fontStyle: 'italic', fontSize: '0.85rem', color: '#f1f5f9', marginBottom: '0.5rem' }}>
              "Nuestra historia también vive aquí."
            </div>
            <div style={{ fontSize: '0.72rem', color: '#95d5b2', fontWeight: '600' }}>
              Los Ángeles • Región del Biobío
            </div>
          </div>
        </div>
      </section>

      {/* 4 Quick Action Cards (Slide 7 Mockup) */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
        <div 
          onClick={() => setActivePage({ name: 'search' })}
          style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2d6a4f'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Search size={20} color="#2d6a4f" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.4rem', color: '#0f2d1e' }}>
            Buscar sepulturas
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: '1.5' }}>
            Encuentra la ubicación exacta de una sepultura por nombre, apellido o número.
          </p>
        </div>

        <div 
          onClick={() => setActivePage({ name: 'map' })}
          style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2d6a4f'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Map size={20} color="#0369a1" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.4rem', color: '#0f2d1e' }}>
            Ver mapa interactivo
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: '1.5' }}>
            Explora el cementerio en un visor cartográfico y conoce la distribución de sus 5 patios.
          </p>
        </div>

        <div 
          onClick={() => setActivePage({ name: 'mausoleos' })}
          style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2d6a4f'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <BookOpen size={20} color="#b45309" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.4rem', color: '#0f2d1e' }}>
            Mausoleos históricos
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: '1.5' }}>
            Descubre nuestro catastro de 40 monumentos emblemáticos con fotografías y reseñas.
          </p>
        </div>

        <div 
          onClick={() => setActivePage({ name: 'map' })}
          style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2d6a4f'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Info size={20} color="#475569" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.4rem', color: '#0f2d1e' }}>
            Información general
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: '1.5' }}>
            Horarios de visita, normativa interna y canales de atención de la administración.
          </p>
        </div>
      </section>

      {/* Two Column Section (Explora el Cementerio + Mausoleo Destacado) */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
        {/* Left: Explora el cementerio / Distribución de Patios */}
        <div style={{ backgroundColor: 'white', padding: '1.75rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f2d1e' }}>
                Explora el cementerio
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
                Conoce la distribución de patios y ubica fácilmente las sepulturas
              </p>
            </div>
            <button 
              onClick={() => setActivePage({ name: 'map' })}
              style={{ background: 'none', border: 'none', color: '#2d6a4f', fontSize: '0.84rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              Ver mapa completo <ArrowRight size={14} />
            </button>
          </div>

          {/* Graphical patio distribution diagram matching mockup */}
          <div style={{ backgroundColor: '#f1f8f4', borderRadius: '12px', padding: '1.25rem', border: '1px dashed #b7e4c7', minHeight: '220px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <div 
                onClick={() => setActivePage({ name: 'map', patio: 1 })}
                style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '8px', borderLeft: '4px solid #1b4332', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
              >
                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#1b4332' }}>Patio 1</div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Acceso Histórico y Panteón</div>
              </div>
              <div 
                onClick={() => setActivePage({ name: 'map', patio: 2 })}
                style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '8px', borderLeft: '4px solid #2d6a4f', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
              >
                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#2d6a4f' }}>Patio 2</div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Sector Central y Familias</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <div 
                onClick={() => setActivePage({ name: 'map', patio: 3 })}
                style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '8px', borderLeft: '4px solid #40916c', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
              >
                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#40916c' }}>Patio 3</div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Pradera Sur y Pabellones</div>
              </div>
              <div 
                onClick={() => setActivePage({ name: 'map', patio: 4 })}
                style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '8px', borderLeft: '4px solid #52b788', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
              >
                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#52b788' }}>Patio 4</div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Avenida Los Álamos</div>
              </div>
            </div>

            <div 
              onClick={() => setActivePage({ name: 'map', patio: 5 })}
              style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '8px', borderLeft: '4px solid #74c69d', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
            >
              <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#74c69d' }}>Patio 5</div>
              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Ampliación Moderna (Catastro 2026)</div>
            </div>
          </div>
        </div>

        {/* Right: Mausoleo Destacado (Familia Rivas) */}
        <div style={{ backgroundColor: 'white', padding: '1.75rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Mausoleo Destacado
              </span>
              <button 
                onClick={() => setActivePage({ name: 'mausoleos' })}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                Ver todos <ArrowRight size={13} />
              </button>
            </div>

            <div style={{ borderRadius: '10px', overflow: 'hidden', height: '170px', marginBottom: '1.1rem', backgroundColor: '#e2e8f0' }}>
              <img 
                src={featuredMausoleo?.foto_url || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80"} 
                alt="Mausoleo de la Familia Rivas"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <h4 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f2d1e', marginBottom: '0.4rem' }}>
              {featuredMausoleo?.nombre || "Mausoleo de la Familia Rivas"}
            </h4>
            <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: '1.5', marginBottom: '1rem' }}>
              {featuredMausoleo?.resena_historica || "Construido en 1933, es uno de los ejemplos más representativos de la arquitectura funeraria de nuestra ciudad."}
            </p>
          </div>

          <button 
            onClick={() => setActivePage({ name: 'mausoleos' })}
            className="btn-secondary" 
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Ver más información <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
};

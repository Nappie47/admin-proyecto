import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, MapPin, Calendar, Compass, ArrowRight } from 'lucide-react';
import { patioService, sepulturaService } from '../services/api';

export const SearchPage = ({ initialQuery, setActivePage }) => {
  const [q, setQ] = useState(initialQuery || '');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [patio, setPatio] = useState('Todos');
  const [sector, setSector] = useState('Todos');
  
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [patios, setPatios] = useState([]);
  const [patiosError, setPatiosError] = useState(null);

  const performSearch = async (page = 1, clearFilters = false) => {
    setLoading(true);
    setSearchError(null);
    try {
      const params = { page, per_page: 12 };
      if (!clearFilters) {
        if (q.trim()) params.q = q.trim();
        if (nombre.trim()) params.nombre = nombre.trim();
        if (apellido.trim()) params.apellido = apellido.trim();
        if (patio !== 'Todos') params.patio = patio;
        if (sector !== 'Todos') params.sector = sector;
      }

      const res = await sepulturaService.list(params);
      if (res.data.success) {
        setResults(res.data.sepulturas);
        setTotalCount(res.data.total);
        setCurrentPage(res.data.page);
        setTotalPages(res.data.pages);
      } else {
        throw new Error(res.data.error || 'No se pudo completar la búsqueda.');
      }
    } catch (err) {
      console.error('Error buscando sepulturas:', err);
      setResults([]);
      setTotalCount(0);
      setTotalPages(0);
      setSearchError('No se pudo realizar la búsqueda. Revisa tu conexión e inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch();
  }, [initialQuery]);

  useEffect(() => {
    let isCurrentRequest = true;
    patioService.list()
      .then(res => {
        if (!res.data.success) {
          throw new Error('El servidor no confirmó la lista de patios.');
        }
        if (isCurrentRequest) setPatios(res.data.patios);
      })
      .catch(err => {
        console.error('Error cargando patios para búsqueda:', err);
        if (isCurrentRequest) {
          setPatiosError('No se pudieron cargar los patios para filtrar la búsqueda.');
        }
      });
    return () => {
      isCurrentRequest = false;
    };
  }, []);

  const handleClearFilters = () => {
    setQ('');
    setNombre('');
    setApellido('');
    setPatio('Todos');
    setSector('Todos');
    performSearch(1, true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    performSearch();
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const day = parseInt(parts[2], 10);
      const month = months[parseInt(parts[1], 10) - 1];
      const year = parts[0];
      return `${day} de ${month} de ${year}`;
    }
    return dateStr;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header section (Mockup Slide 7 Right) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Buscador de Sepulturas
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f2d1e', margin: '0.2rem 0 0.5rem 0' }}>
            Buscar sepulturas
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b', maxWidth: '650px' }}>
            Encuentra la ubicación de una sepultura, consulta sus datos y visualízala en el mapa de manera rápida y sencilla.
          </p>
        </div>

        {/* Community motto card */}
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem 1.25rem', borderRadius: '12px', maxWidth: '280px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '1.5rem' }}>🕊️</div>
          <div style={{ fontSize: '0.8rem', color: '#166534', lineHeight: '1.4' }}>
            Un espacio de memoria y patrimonio para nuestra comunidad.
          </div>
        </div>
      </div>

      {/* Main Search Bar */}
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px -2px rgba(0,0,0,0.04)', marginBottom: '2rem' }}>
        <form onSubmit={handleFormSubmit}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: '#94a3b8' }} />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre, apellido o número de sepultura..."
                className="form-input"
                style={{ paddingLeft: '2.6rem', height: '44px' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '0 1.8rem', height: '44px' }}>
              Buscar
            </button>
          </div>

          {/* Granular Filters matching Slide 7 Right */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.35rem', color: '#475569' }}>
                Nombre
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Juan"
                className="form-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.35rem', color: '#475569' }}>
                Apellido
              </label>
              <input
                type="text"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                placeholder="Ej. Pérez"
                className="form-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.35rem', color: '#475569' }}>
                Patio
              </label>
              <select 
                value={patio} 
                onChange={(e) => setPatio(e.target.value)}
                className="form-select"
                style={{ width: '100%' }}
              >
                <option value="Todos">Todos</option>
                {patios.map(patio => (
                  <option key={patio.id} value={patio.numero}>
                    Patio {patio.numero}{patio.nombre ? ` — ${patio.nombre}` : ''}
                  </option>
                ))}
              </select>
              {patiosError && (
                <span role="alert" style={{ display: 'block', marginTop: '0.35rem', color: '#991b1b', fontSize: '0.78rem' }}>
                  {patiosError}
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.35rem', color: '#475569' }}>
                Sector
              </label>
              <select 
                value={sector} 
                onChange={(e) => setSector(e.target.value)}
                className="form-select"
                style={{ width: '100%' }}
              >
                <option value="Todos">Todos</option>
                <option value="A">Sector A</option>
                <option value="B">Sector B</option>
                <option value="C">Sector C</option>
                <option value="D">Sector D</option>
              </select>
            </div>

            <div>
              <button 
                type="button" 
                onClick={handleClearFilters}
                className="btn-secondary"
                style={{ width: '100%', height: '40px', justifyContent: 'center' }}
              >
                <RotateCcw size={15} />
                Limpiar filtros
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1e293b' }}>
          {loading ? 'Buscando sepulturas...' : `${totalCount} sepulturas encontradas`}
        </div>
        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
          Ordenar por: <span style={{ fontWeight: '600', color: '#1e293b' }}>Relevancia</span>
        </div>
      </div>

      {searchError && (
        <div role="alert" style={{ marginBottom: '1rem', padding: '0.85rem 1rem', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#991b1b' }}>
          {searchError}
        </div>
      )}

      {/* Results List (Slide 7 Right Cards) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {results.map((sep) => {
          const isOcupada = sep.estado === 'Ocupada';
          const fNac = formatDateDisplay(sep.fecha_nacimiento);
          const fFal = formatDateDisplay(sep.fecha_fallecimiento);

          return (
            <div
              key={sep.id}
              style={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                transition: 'all 0.2s',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2d6a4f';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(45, 106, 79, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
              }}
            >
              {/* Left Column: Icon + Name + Dates */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: '320px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: isOcupada ? '#f1f8f4' : '#f0f9ff',
                  border: `1px solid ${isOcupada ? '#b7e4c7' : '#bae6fd'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isOcupada ? '#2d6a4f' : '#0369a1',
                  fontSize: '1.25rem',
                  fontWeight: '700'
                }}>
                  {isOcupada ? '✝' : 'O'}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <h3 
                      onClick={() => setActivePage({ name: 'detail', id: sep.id })}
                      style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f2d1e', cursor: 'pointer' }}
                    >
                      {isOcupada ? sep.nombre_completo : `Sepultura Disponible #${sep.numero}`}
                    </h3>
                    <span className={`badge-status ${sep.estado.toLowerCase().replace(' ', '-')}`}>
                      {sep.estado}
                    </span>
                  </div>

                  {isOcupada && (
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: '#64748b', marginTop: '0.25rem' }}>
                      {fNac && <span>★ {fNac}</span>}
                      {fFal && <span>✝ {fFal}</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Middle Column: Metadata Pills matching Slide 7 */}
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Patio</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b' }}>{sep.patio_numero}</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Sector</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b' }}>{sep.sector}</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Número</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b' }}>{sep.numero}</div>
                </div>
              </div>

              {/* Right Action Button */}
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  onClick={() => setActivePage({ name: 'map', selectedGraveId: sep.id })}
                  className="btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
                >
                  <MapPin size={15} color="#2d6a4f" />
                  Ver en el mapa
                </button>
                <button
                  onClick={() => setActivePage({ name: 'detail', id: sep.id })}
                  className="btn-primary"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
                >
                  Ver ficha <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {results.length === 0 && !loading && !searchError && (
          <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '16px', textAlign: 'center', border: '1px solid #e2e8f0', color: '#64748b' }}>
            <Search size={36} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
              No se encontraron sepulturas
            </h4>
            <p style={{ fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
              Intenta buscar con otros términos, ajustar los filtros de patio o sector, o limpiar los filtros.
            </p>
            <button onClick={handleClearFilters} className="btn-secondary">
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Paginación de resultados" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            className="btn-secondary"
            disabled={loading || currentPage <= 1}
            onClick={() => performSearch(currentPage - 1)}
          >
            Anterior
          </button>
          <span aria-live="polite" style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Página {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            className="btn-secondary"
            disabled={loading || currentPage >= totalPages}
            onClick={() => performSearch(currentPage + 1)}
          >
            Siguiente
          </button>
        </nav>
      )}
    </div>
  );
};

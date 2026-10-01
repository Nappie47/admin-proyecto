import React from 'react';
import { Heart, Mail, Phone, MapPin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="footer-banner">
      <div className="footer-inner">
        <div style={{ maxWidth: '480px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <Heart size={20} color="#74c69d" />
            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', letterSpacing: '-0.01em' }}>
              Memoria que nos une
            </h4>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6' }}>
            Honramos el pasado, cuidamos el presente y preservamos la memoria para las futuras generaciones. Plataforma piloto para explorar una muestra de información y cartografía del Cementerio General de Los Ángeles.
          </p>
        </div>

        <div>
          <h5 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.75rem' }}>
            Ubicación y Contacto
          </h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#e2e8f0' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={15} color="#52b788" /> Av. Gabriela Mistral s/n, Los Ángeles, Biobío
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Phone size={15} color="#52b788" /> +56 43 240 9000
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={15} color="#52b788" /> cementerio@losangeles.cl
            </span>
          </div>
        </div>
      </div>
      
      <div style={{ maxWidth: '1200px', margin: '2rem auto 0', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.78rem', color: '#94a3b8' }}>
        <span>© 2026 Municipalidad de Los Ángeles. Todos los derechos reservados.</span>
      </div>
    </footer>
  );
};

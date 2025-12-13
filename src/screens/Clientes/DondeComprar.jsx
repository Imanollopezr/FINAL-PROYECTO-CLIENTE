import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaPaw, FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa';
import './ClientesLanding.scss';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { getDefaultRouteByRole } from '../../shared/utils/roleRouting';

const LeafletMap = ({ address }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const ensureLeaflet = async () => {
      if (!document.querySelector('link[data-leaflet]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.setAttribute('data-leaflet', 'true');
        document.head.appendChild(link);
      }
      if (!window.L) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }
    };

    const initMap = async () => {
      try {
        await ensureLeaflet();
        const L = window.L;
        if (!L) throw new Error('Leaflet no cargó');
        if (!mapInstanceRef.current) {
          mapInstanceRef.current = L.map(mapRef.current, { zoomControl: true });
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(mapInstanceRef.current);
        }
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await resp.json();
        if (data && data[0]) {
          const { lat, lon, display_name } = data[0];
          const pos = [parseFloat(lat), parseFloat(lon)];
          mapInstanceRef.current.setView(pos, 16);
          L.circleMarker(pos, { radius: 10, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 1 }).addTo(mapInstanceRef.current)
            .bindPopup(`<strong>Sucursal</strong><br/>${display_name}`);
        } else {
          setFallback(true);
        }
      } catch (e) {
        setFallback(true);
      }
    };

    initMap();
    return () => {};
  }, [address]);

  if (fallback) {
    const embed = `https://www.google.com/maps?q=${encodeURIComponent(address)}&hl=es&z=16&output=embed`;
    return (
      <iframe
        title="Mapa"
        className="leaflet-host"
        src={embed}
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    );
  }
  return <div ref={mapRef} className="leaflet-host" />;
};

const DondeComprar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const isActive = (path) => {
    if (path === '/blog') return location.pathname.startsWith('/blog');
    return location.pathname === path;
  };
  const direccion = '43-214, Dg. 55 #43-70, Bello, Antioquia';
  const [searchAddress, setSearchAddress] = useState(direccion);
  const [mapQuery, setMapQuery] = useState(encodeURIComponent(direccion));
  const direccionUrl = 'https://maps.app.goo.gl/fD86hyCQcAhb1M8AA';
  const openExternal = () => window.open(direccionUrl, '_blank');
  const doSearch = () => setMapQuery(encodeURIComponent(searchAddress));
  const resetSearch = () => { setSearchAddress(direccion); setMapQuery(encodeURIComponent(direccion)); };
  const goToModules = () => {
    const route = getDefaultRouteByRole(user?.role || 'Visitante');
    navigate(route);
  };
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="pet-love-landing minimal">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon"><FaPaw size={22} /></span>
            <span className="logo-text">Pet Love</span>
            <div className="logo-glow"></div>
          </div>
          <nav className="nav-menu">
            {/* Orden: Inicio, ¿Dónde comprar?, Productos, Blog. Ocultamos el actual (¿Dónde comprar?). */}
            <a href="/" onClick={(e) => { e.preventDefault(); if (!isActive('/')) navigate('/'); }}>
              <span>Inicio</span>
              <div className="nav-indicator"></div>
            </a>
            {/* ¿Dónde comprar? oculto por estar en esta página */}
            <a href="/productos-tienda" onClick={(e) => { e.preventDefault(); if (!isActive('/productos-tienda')) navigate('/productos-tienda'); }}>
              <span>Productos</span>
              <div className="nav-indicator"></div>
            </a>
            <a href="/blog" onClick={(e) => { e.preventDefault(); if (!isActive('/blog')) navigate('/blog'); }}>
              <span>Blog</span>
              <div className="nav-indicator"></div>
            </a>
          </nav>
          <div className="header-actions">
            {isAuthenticated && user?.role === 'Administrador' ? (
              <>
                <button className="btn-primary btn-hero" onClick={goToModules}>
                  Ir a mis módulos
                </button>
                <button className="btn-secondary btn-hero" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button className="btn-primary btn-hero" onClick={() => navigate('/login')}>
                Iniciar sesión
              </button>
            )}
            <span className="icon-static" aria-hidden="true">
              <FaUser size={18} />
            </span>
          </div>
        </div>
      </header>

      <section className="map-section">
        <div className="map-container">
          <div className="map-banner">
            <div className="banner-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-7.16 7-12a7 7 0 10-14 0c0 4.84 7 12 7 12z" stroke="#f59e0b" strokeWidth="2"/><circle cx="12" cy="9" r="2.5" fill="#f59e0b"/></svg>
            </div>
            <div>
              <h2>¿Dónde compro?</h2>
              <p>Permítenos tu ubicación para ver dónde comprar nuestros productos.</p>
            </div>
          </div>
          <div className="map-card">
            <div className="map-embed">
              <div className="map-controls">
                <input
                  type="text"
                  className="map-input"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  placeholder="Escribe tu ciudad, barrio o dirección"
                />
                <select className="map-select" defaultValue="10">
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="25">25 km</option>
                </select>
                <button className="btn-leer-mas" onClick={doSearch}>Buscar</button>
                <button className="btn-secondary" onClick={resetSearch}>Reset</button>
              </div>
              <LeafletMap address={decodeURIComponent(mapQuery)} />
            </div>
            <aside className="map-side">
              <div className="branch-highlight">
                <span className="branch-badge">Sucursal principal</span>
                <h3>Pet Love</h3>
                <p>{direccion}</p>
              </div>
              <div className="branch-list">
                <div className="branch-item">
                  <strong>Pet Love – 4325 Dg. 55</strong>
                  <div className="branch-actions">
                    <button className="btn-leer-mas" onClick={openExternal}>Ver en Google Maps</button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
      <footer id="contacto" className="footer footer-alt">
        <div className="footer-wave"></div>
        <div className="footer-wrap">
          <div className="brand-block">
            <div className="footer-logo">
              <span className="logo-icon">🐾</span>
              <span className="logo-text">Pet Love</span>
            </div>
            <p>Tu tienda de confianza para el cuidado de mascotas</p>
            <div className="social-row">
              <a href="#" className="social-circle"><FaFacebookF /></a>
              <a href="#" className="social-circle"><FaInstagram /></a>
              <a href="#" className="social-circle"><FaTwitter /></a>
            </div>
          </div>
          <div className="newsletter-block">
            <h4>Únete a la manada</h4>
            <p>Recibe ofertas exclusivas y novedades</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Tu correo" />
              <button className="btn-newsletter">Suscribirme</button>
            </form>
          </div>
          <div className="links-block">
            <div className="link-group">
              <h5>Compañía</h5>
              <a href="#">Nosotros</a>
              <a href="#">Blog</a>
              <a href="#">Comunidad</a>
            </div>
            <div className="link-group">
              <h5>Ayuda</h5>
              <a href="#">Soporte</a>
              <a href="#">Preguntas frecuentes</a>
              <a href="#">¿Dónde comprar?</a>
            </div>
            <div className="link-group">
              <h5>Legal</h5>
              <a href="#">Privacidad</a>
              <a href="#">Términos</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
        <div className="footer-bar">
          <span>&copy; 2024 Pet Love</span>
          <span>Hecho con 🐾</span>
        </div>
      </footer>
    </div>
  );
};

export default DondeComprar;

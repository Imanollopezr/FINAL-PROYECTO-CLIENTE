import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import categoriasService from '../../services/categoriasService';
import { FaUser, FaPaw, FaFacebookF, FaInstagram, FaTwitter, FaDog, FaCat, FaBone, FaSoap, FaRibbon, FaPuzzlePiece } from 'react-icons/fa';
import './ClientesLanding.scss';
import perroPng from '../../assets/images/perro.png';
import mascotasImage from '../../assets/images/mascotas.png';
import mascotasLoginImage from '../../assets/images/Mascotaslogin2.png';
import petincioImage from '../../assets/images/petincio.png';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { getDefaultRouteByRole } from '../../shared/utils/roleRouting';

const ClientesLanding = () => {
  const navigate = useNavigate();
  const isLoading = false;
  const { isAuthenticated, user, logout } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [categorias, setCategorias] = useState([]);
  const [heroImage, setHeroImage] = useState(perroPng);

  // *** CAMBIO IMPORTANTE ***
  const [heroVideoUrl, setHeroVideoUrl] = useState('/landing.mp4');

  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const cats = await categoriasService.obtenerCategorias();
        const lista = (cats || []).map((c, i) => ({
          id: c.id ?? i + 1,
          nombre: c.nombre ?? c.Nombre ?? (typeof c === 'string' ? c : 'Categoría'),
        }));
        setCategorias(lista);
      } catch (e) {
        setCategorias([]);
      }
    };
    cargarCategorias();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    setHeroImage(perroPng);
  }, []);

  const navegarALogin = () => {
    navigate('/login');
  };

  const navegarAProductos = () => {
    navigate('/productos-tienda');
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner">
            <div className="paw-print">🐾</div>
          </div>
          <h2>Cargando Pet Love...</h2>
          <p>Preparando la mejor tienda de mascostas para ti</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pet-love-landing minimal theme-calabaza">
      
      <div 
        className="custom-cursor"
        style={{
          left: `${mousePosition.x}%`,
          top: `${mousePosition.y}%`
        }}
      >
        🐾
      </div>

      {/* Topbar fija */}
      <div className="topbar">
        <div className="topbar-content">
          <span className="topbar-link">¡Te damos la bienvenida!</span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span
              className="topbar-link"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/ayuda')}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate('/ayuda'); }}
            >
              Ayuda
            </span>
            <button
              className="btn-distribuidores"
              type="button"
              onClick={() => navigate('/distribuidores')}
              aria-label="Distribuidores"
            >
              Distribuidores
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon"><FaPaw size={22} /></span>
            <span className="logo-text">PetLove</span>
          </div>

          <nav className="nav-menu">
            <a href="#inicio" onClick={(e) => { e.preventDefault(); scrollToSection('inicio'); }}>
              <span>Inicio</span>
              <div className="nav-indicator"></div>
            </a>
            <a href="/donde-comprar" onClick={(e) => { e.preventDefault(); navigate('/donde-comprar'); }}>
              <span>¿Dónde comprar?</span>
              <div className="nav-indicator"></div>
            </a>
            <a href="#productos" onClick={(e) => { e.preventDefault(); navegarAProductos(); }}>
              <span>Productos</span>
              <div className="nav-indicator"></div>
            </a>
            <a href="/blog" onClick={(e) => { e.preventDefault(); navigate('/blog'); }}>
              <span>Blog</span>
              <div className="nav-indicator"></div>
            </a>
          </nav>

          <div className="header-actions">
            {isAuthenticated ? (
              <>
                <button
                  className="btn-primary btn-hero volver-modulos-btn"
                  onClick={() => navigate(getDefaultRouteByRole(user?.role))}
                >
                  Mis módulos
                </button>
                <button
                  className="btn-outline btn-hero"
                  onClick={async () => { await logout(); navigate('/'); }}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button className="btn-primary btn-hero" onClick={navegarALogin}>
                Iniciar sesión
              </button>
            )}
            <span className="icon-static" aria-hidden="true">
              <FaUser size={18} />
            </span>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="inicio" className="hero-section variant-calabaza">
        <div className="hero-background">
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <div className="title-stack">
              <h1 className="hero-title hero-title-back">
                Bienvenido a la <span className="highlight">tienda de mascotas</span>
              </h1>
              <h1 className="hero-title hero-title-front" aria-hidden="true">
                Bienvenido a la <span className="highlight">tienda de mascotas</span>
              </h1>
            </div>
            <p className="hero-subtitle">
              Cuidamos y consentimos a tus mejores amigos con productos y atención de calidad.
            </p>
          </div>

          {/* VIDEO O IMAGEN */}
          <div className="hero-visual">
            <div className="pop-stage">
              <div className="frame-panel">
                <div
                  className="hero-cutout"
                  style={{
                    transform: `rotateY(${((mousePosition.x - 50) / -40).toFixed(2)}deg) rotateX(${((mousePosition.y - 50) / 40).toFixed(2)}deg)`
                  }}
                >
                  {heroVideoUrl ? (
                    <video
                      src={heroVideoUrl}
                      className="cutout-video"
                      autoPlay
                      muted
                      loop
                      playsInline
                      aria-label="Video de mascota feliz"
                      onError={() => setHeroVideoUrl(null)}
                    />
                  ) : (
                    <img
                      src={heroImage}
                      alt="Mascota feliz"
                      className="cutout-dog"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="categorias-banda">
        <div className="categorias-container">
          {(categorias || []).map((cat) => {
            const nombre = String(cat.nombre || '').trim();
            const slug = nombre
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/ñ/g, 'n')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '');

            const getChipIconComponent = (texto) => {
              const t = String(texto || '').toLowerCase();
              if (/juguet/.test(t)) return FaPuzzlePiece;
              if (/alimenta|snack|comida/.test(t)) return FaBone;
              if (/higien|arena|baño|aseo/.test(t)) return FaSoap;
              if (/accesor|correa|arnes|ropa/.test(t)) return FaRibbon;
              if (/gato|felino/.test(t)) return FaCat;
              if (/perro|can|mascota/.test(t)) return FaDog;
              return FaPaw;
            };

            const IconComp = getChipIconComponent(nombre);

            return (
              <div
                key={cat.id}
                className={`categoria-chip cat-${slug}`}
                onClick={() => navigate(`/videos-categoria/${slug || 'general'}`)}
                role="button"
                aria-label={`Ver videos de ${nombre}`}
              >
                <span className="chip-icon"><IconComp className="chip-icon-svg" /></span>
                <span className="chip-text">{nombre || 'Categoría'}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="destacados-section" id="destacados">
        <div className="destacados-container">
          <div className="section-header">
            <h2>Inspiración para tu mascota</h2>
            <p>Ideas y contenido para el bienestar y la diversión</p>
          </div>
          <div className="destacados-grid">
            <div className="destacado-card">
              <div className="card-media">
                <img
                  src="https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1200&auto=format&fit=crop"
                  alt="Perros jugando con juguetes"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = mascotasLoginImage; }}
                />
              </div>
              <div className="card-body">
                <h3>Juguetes irresistibles</h3>
                <p>Diversión asegurada con materiales seguros y duraderos.</p>
                <button className="btn-outline" onClick={() => navigate('/productos-tienda')}>Ver más</button>
              </div>
            </div>
            <div className="destacado-card">
              <div className="card-media">
                <img
                  src="https://images.unsplash.com/photo-1589924691995-400dc9ecc119?q=80&w=1200&h=800&auto=format&fit=crop"
                  alt="Alimento para mascotas en plato"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = mascotasImage; }}
                />
              </div>
              <div className="card-body">
                <h3>Alimento premium</h3>
                <p>Nutrición balanceada para cada etapa de vida.</p>
                <button className="btn-outline" onClick={() => navigate('/productos-tienda')}>Ver más</button>
              </div>
            </div>
            <div className="destacado-card">
              <div className="card-media">
                <img
                  src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&h=800&auto=format&fit=crop"
                  alt="Baño y cuidado de mascotas"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = petincioImage; }}
                />
              </div>
              <div className="card-body">
                <h3>Cuidado e higiene</h3>
                <p>Productos pensados para su bienestar diario.</p>
                <button className="btn-outline" onClick={() => navigate('/productos-tienda')}>Ver más</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="nosotros-section" id="nosotros">
        <div className="nosotros-content">
          <div className="nosotros-text">
            <h2>Amor por las mascotas</h2>
            <p className="nosotros-intro">
              Ofrecemos productos y contenido para mejorar la vida de tus compañeros peludos.
            </p>
            <div className="nosotros-features">
              <div className="feature">
                <span className="feature-icon"><FaRibbon /></span>
                <div className="feature-content">
                  <h4>Calidad certificada</h4>
                  <p>Selección de marcas reconocidas y materiales seguros.</p>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon"><FaBone /></span>
                <div className="feature-content">
                  <h4>Nutrición responsable</h4>
                  <p>Alimentos pensados para su salud y energía diaria.</p>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon"><FaPaw /></span>
                <div className="feature-content">
                  <h4>Comunidad activa</h4>
                  <p>Consejos, guías y experiencias para el cuidado integral.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="nosotros-visual">
            <div className="nosotros-card">
              <div className="card-header">
                <h3>Nuestra misión</h3>
              </div>
              <div className="card-content">
                <p>
                  Inspirar una relación más feliz y saludable entre humanos y mascotas mediante buenos hábitos y productos confiables.
                </p>
                <div className="mission-stats">
                  <div className="mission-stat">
                    <span className="stat-icon"><FaDog /></span>
                    <span className="stat-text">+500 productos para perros</span>
                  </div>
                  <div className="mission-stat">
                    <span className="stat-icon"><FaCat /></span>
                    <span className="stat-text">+300 opciones para gatos</span>
                  </div>
                  <div className="mission-stat">
                    <span className="stat-icon"><FaPuzzlePiece /></span>
                    <span className="stat-text">Guías y tips semanales</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="blog-section" id="blog-destacados">
        <div className="blog-container">
          <div className="blog-header">
            <h2>Desde el blog</h2>
            <p>Consejos y novedades para el cuidado de tus mascotas</p>
          </div>
          <div className="blog-grid">
            <article className="blog-card">
              <div className="blog-thumb">
                <span className="blog-badge">Guías</span>
                <img
                  src="https://images.unsplash.com/photo-1516379092867-177c3c5c7e66?q=80&w=1200&auto=format&fit=crop"
                  alt="Rutinas de paseo"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = heroImage; }}
                />
              </div>
              <div>
                <h3 className="blog-title">Rutinas de paseo saludables</h3>
                <div className="blog-meta">
                  <span>Guías</span>
                  <span>5 min</span>
                </div>
                <p className="blog-excerpt">Ideas para hacer del paseo un momento seguro y divertido.</p>
                <button className="btn-leer-mas" onClick={() => navigate('/blog')}>Leer más</button>
              </div>
            </article>
            <aside className="blog-sidebar">
              <div className="blog-about">
                <h3>Sobre Pet Love</h3>
                <p>Contenido curado por amantes de las mascotas.</p>
              </div>
              <div className="blog-categories">
                <h4>Categorías</h4>
                <ul>
                  {(categorias || []).slice(0, 6).map((c) => (
                    <li key={c.id}>{String(c.nombre || '').trim()}</li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* FOOTER */}
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

export default ClientesLanding;

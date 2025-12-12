import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import categoriasService from '../../services/categoriasService';
import { FaUser, FaPaw, FaFacebookF, FaInstagram, FaTwitter, FaDog, FaCat, FaBone, FaSoap, FaRibbon, FaPuzzlePiece } from 'react-icons/fa';
import './ClientesLanding.scss';
import perroPng from '../../assets/images/perro.png';
import pexelsService from '../../services/pexelsService';

const ClientesLanding = () => {
  const navigate = useNavigate();
  const isLoading = false;
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
            <button className="btn-primary btn-hero" onClick={navegarALogin}>
              Iniciar sesión
            </button>
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

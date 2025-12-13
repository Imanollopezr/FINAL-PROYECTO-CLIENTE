import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaPaw, FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa';
import './ClientesLanding.scss';
import imageApiService from '../../services/imageApiService';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { getDefaultRouteByRole } from '../../shared/utils/roleRouting';

const posts = [
  {
    slug: 'quienes-somos',
    title: 'Quiénes somos en Pet Love',
    image: '/uploads/blog/quienes-somos.jpg',
    date: '01/11/2025',
    category: 'Nosotros',
    comments: 0,
    excerpt: 'Conoce nuestra misión, valores y el amor que nos mueve por las mascotas.',
  },
  {
    slug: 'importadores-arena-gatos',
    title: 'Importadores y distribuidores de arena para gatos en Colombia',
    image: '/uploads/blog/arena-gatos.jpg',
    date: '09/11/2025',
    category: 'Blog',
    comments: 0,
    excerpt: 'Cobertura nacional, stock permanente y selección de arenas con alto desempeño en absorción y control de olores.',
  },
  {
    slug: 'concurso-halloween',
    title: 'Distribuidores oficiales y cómo comprar productos Pet Love',
    image: '/uploads/blog/concurso-halloween.jpg',
    date: '31/10/2025',
    category: 'Comunidad',
    comments: 0,
    excerpt: 'Encuentra distribuidores oficiales, canales de compra y soporte para adquirir nuestros productos con confianza.',
  },
];

const BlogList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [apiImages, setApiImages] = useState([]);
  const isActive = (path) => {
    if (path === '/blog') return location.pathname.startsWith('/blog');
    return location.pathname === path;
  };
  useEffect(() => {
    const loadImages = async () => {
      let imgs = await imageApiService.getCarouselImages(posts.length);
      if (!Array.isArray(imgs) || imgs.length < posts.length) {
        const extra = await imageApiService.getImages('pets', { count: posts.length });
        const combined = [...(imgs || []), ...(extra || [])];
        imgs = combined.slice(0, posts.length);
      }
      setApiImages(imgs);
    };
    loadImages();
  }, []);
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
            <a href="/" onClick={(e) => { e.preventDefault(); if (!isActive('/')) navigate('/'); }}>
              <span>Inicio</span>
              <div className="nav-indicator"></div>
            </a>
            <a href="/donde-comprar" onClick={(e) => { e.preventDefault(); if (!isActive('/donde-comprar')) navigate('/donde-comprar'); }}>
              <span>¿Dónde comprar?</span>
              <div className="nav-indicator"></div>
            </a>
            <a href="/productos-tienda" onClick={(e) => { e.preventDefault(); if (!isActive('/productos-tienda')) navigate('/productos-tienda'); }}>
              <span>Productos</span>
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

      <section className="blog-section">
        <div className="blog-container">
          <div className="blog-header">
            <h2>Novedades Pet Love</h2>
            <p>Todo sobre tu mascota</p>
          </div>
          <div className="blog-grid">
            <div className="blog-list">
              {posts.map((post, idx) => (
                <article key={post.slug} className="blog-card">
                  <div className="blog-thumb">
                    <img src={(apiImages[idx] && apiImages[idx].url) || post.image} alt={post.title} loading="lazy" />
                  </div>
                  <div className="blog-info">
                    <h3 className="blog-title">{post.title}</h3>
                    <div className="blog-meta">
                      <span>{post.category}</span>
                      <span>·</span>
                      <span>{post.date}</span>
                      <span>·</span>
                      <span>{post.comments} comentarios</span>
                    </div>
                    <p className="blog-excerpt">{post.excerpt}</p>
                    <button className="btn-leer-mas" onClick={() => navigate(`/blog/${post.slug}`, { state: { apiImage: apiImages[idx] } })}>Leer más</button>
                  </div>
                </article>
              ))}
            </div>
            <aside className="blog-sidebar">
              <div className="blog-about">
                <div className="about-header">
                  <span className="about-icon">🐾</span>
                  <h3>Sobre Pet Love</h3>
                </div>
                <p>Contenido curado por amantes de las mascotas.</p>
                <ul className="about-highlights">
                  <li>Consejos prácticos</li>
                  <li>Guías de cuidado</li>
                  <li>Productos recomendados</li>
                </ul>
                <button
                  className="about-cta"
                  onClick={() => navigate('/blog/quienes-somos')}
                >
                  Conócenos
                </button>
              </div>
              <div className="blog-categories">
                <h4>Categorías</h4>
                <ul>
                  <li>Gatos</li>
                  <li>Perros</li>
                  <li>Tips</li>
                  <li>Concursos</li>
                  <li>Salud</li>
                  <li>Snacks</li>
                </ul>
              </div>
            </aside>
          </div>
          <div className="attribution">
            <p>
              Imágenes proporcionadas por{' '}
              <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>,{' '}
              <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer">Pexels</a>{' '}y{' '}
              <a href="https://pixabay.com" target="_blank" rel="noopener noreferrer">Pixabay</a>
            </p>
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

export default BlogList;

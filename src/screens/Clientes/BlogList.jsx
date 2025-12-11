import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import './ClientesLanding.scss';
import imageApiService from '../../services/imageApiService';

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
            <span className="logo-icon">🐾</span>
            <span className="logo-text">Pet Love</span>
            <div className="logo-glow"></div>
          </div>
          <nav className="nav-menu">
            {/* Orden: Inicio, ¿Dónde comprar?, Nosotros, Productos, Comunidad, Blog. Ocultamos el actual (Blog). */}
            <a href="/" onClick={(e) => { e.preventDefault(); if (!isActive('/')) navigate('/'); }}>
              <span>Inicio</span>
              <div className="nav-indicator"></div>
            </a>
            <a href="/donde-comprar" onClick={(e) => { e.preventDefault(); if (!isActive('/donde-comprar')) navigate('/donde-comprar'); }}>
              <span>¿Dónde comprar?</span>
              <div className="nav-indicator"></div>
            </a>
            <a href="/" onClick={(e) => { e.preventDefault(); if (!isActive('/')) navigate('/'); }}>
              <span>Nosotros</span>
              <div className="nav-indicator"></div>
            </a>
            <a href="/productos-tienda" onClick={(e) => { e.preventDefault(); if (!isActive('/productos-tienda')) navigate('/productos-tienda'); }}>
              <span>Productos</span>
              <div className="nav-indicator"></div>
            </a>
            <a href="/" onClick={(e) => { e.preventDefault(); if (!isActive('/')) navigate('/'); }}>
              <span>Comunidad</span>
              <div className="nav-indicator"></div>
            </a>
            {/* Blog oculto */}
          </nav>
          <div className="header-actions">
            <button className="icon-button" onClick={() => navigate('/login')} aria-label="Cuenta">
              <FaUser size={18} />
            </button>
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
                <h3>Sobre nosotros</h3>
                <p>Este es un espacio creado para compartir contigo todo lo que necesitas saber acerca de tu mascota: información curiosa, su cuidado y las mejores opciones para consentir a este miembro tan importante de tu familia.</p>
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
      <footer id="contacto" className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <span className="logo-icon">🐾</span>
              <span className="logo-text">Pet Love</span>
            </div>
            <p>Tu tienda de confianza para el cuidado de mascotas</p>
            <div className="social-links">
              <a href="#" className="social-link">FB</a>
              <a href="#" className="social-link">IG</a>
              <a href="#" className="social-link">TW</a>
            </div>
          </div>
          <div className="footer-section">
            <h4>Contacto</h4>
            <div className="contact-info">
              <p>Dirección: Calle Principal 123, Ciudad</p>
              <p>Teléfono: +57 300 123 4567</p>
              <p>Email: info@petlove.com</p>
            </div>
          </div>
          <div className="footer-section">
            <h4>Horarios</h4>
            <div className="schedule">
              <p>Lunes - Viernes: 9:00 - 18:00</p>
              <p>Sábados: 9:00 - 16:00</p>
              <p>Domingos: 10:00 - 14:00</p>
            </div>
          </div>
          <div className="footer-section">
            <h4>Enlaces</h4>
            <div className="footer-links">
              <a href="#">Política de Privacidad</a>
              <a href="#">Términos y Condiciones</a>
              <a href="#">Preguntas Frecuentes</a>
              <a href="#">Soporte</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Pet Love. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default BlogList;

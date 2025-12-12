import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import './ClientesLanding.scss';
import imageApiService from '../../services/imageApiService';

const BLOG_CONTENT = {
  'quienes-somos': {
    title: 'Quiénes somos en Pet Love',
    image: '/uploads/blog/quienes-somos.jpg',
    date: '01/11/2025',
    category: 'Nosotros',
    content: `En Pet Love somos apasionados por el bienestar de las mascotas.
Nuestro propósito es ofrecer productos seleccionados con estándares altos de calidad,
acompañados de información útil y cercana para ayudarte a cuidar y consentir a tus compañeros peludos.

Trabajamos con marcas confiables, promovemos el cuidado responsable y creemos en la comunidad
de personas que aman a los animales tanto como nosotros.`
  },
  'importadores-arena-gatos': {
    title: 'Importadores y distribuidores de arena para gatos en Colombia',
    image: '/uploads/blog/arena-gatos.jpg',
    date: '09/11/2025',
    category: 'Blog',
    content: `En Pet Love importamos y distribuimos arenas para gatos seleccionadas por su alto desempeño en absorción y control de olores.
Priorizamos materiales seguros, fichas técnicas claras y proveedores certificados.

• Cobertura nacional y stock permanente.
• Presentaciones pensadas para hogares y criaderos.
• Acompañamiento y soporte al cliente para una transición de arena sin estrés.

Si eres distribuidor o tienda, contáctanos para acuerdos comerciales y suministro constante.`
  },
  'concurso-halloween': {
    title: 'Distribuidores oficiales y cómo comprar productos Pet Love',
    image: '/uploads/blog/concurso-halloween.jpg',
    date: '31/10/2025',
    category: 'Comunidad',
    content: `Conoce nuestros distribuidores oficiales y los canales para comprar productos Pet Love.

• Compra directa: consulta los puntos de venta y cobertura.
• Distribuidores acreditados: aliados con inventario y soporte.
• Atención al cliente: asesoría para elegir la mejor opción para tu mascota.

¿Deseas ser distribuidor? Escríbenos y te compartimos requisitos y beneficios.`
  }
};

const BlogDetalle = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => {
    if (path === '/blog') return location.pathname.startsWith('/blog');
    return location.pathname === path;
  };
  const post = BLOG_CONTENT[slug];
  const apiImage = location?.state?.apiImage;
  const [displayImage, setDisplayImage] = useState((apiImage && apiImage.url) || (post && post.image));

  useEffect(() => {
    let active = true;
    const loadImage = async () => {
      if (!post) return;
      if (apiImage && apiImage.url) {
        setDisplayImage(apiImage.url);
        return;
      }
      try {
        const terms = [post.title, post.category, 'dog', 'cat', 'pet'].filter(Boolean).join(' ');
        const results = await imageApiService.searchImages(terms, 1);
        const url = (results && results[0] && results[0].url) || post.image;
        if (active) setDisplayImage(url);
      } catch (e) {
        if (active) setDisplayImage(post.image);
      }
    };
    loadImage();
    return () => { active = false; };
  }, [slug]);

  if (!post) {
    return (
      <div style={{ maxWidth: 900, margin: '48px auto', padding: '0 16px' }}>
        <h2>Entrada no encontrada</h2>
        <p>La publicación que buscas no existe.</p>
        <button onClick={() => navigate('/')} style={{ padding: '10px 16px', borderRadius: 8 }}>Volver al inicio</button>
      </div>
    );
  }

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
            <h2>{post.title}</h2>
            <p>{post.category} · {post.date}</p>
          </div>
          <div className="blog-grid" style={{ gridTemplateColumns: '1fr' }}>
            <article className="blog-card" style={{ gridTemplateColumns: '1fr', maxWidth: 800, margin: '0 auto' }}>
              <div className="blog-thumb" style={{ maxWidth: 420, margin: '0 auto' }}>
                <img src={displayImage} alt={post.title} loading="lazy" style={{ width: '100%', display: 'block' }} />
              </div>
              <div className="blog-info">
                {post.content.split('\n').map((p, i) => (
                  <p key={i} className="blog-excerpt" style={{ marginBottom: 12 }}>{p}</p>
                ))}
                <button className="btn-leer-mas" onClick={() => navigate('/blog')}>Volver al blog</button>
              </div>
            </article>
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

export default BlogDetalle;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaPaw, FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa';
import './ClientesLanding.scss';
import imageApiService from '../../services/imageApiService';
import logoImg from '../../assets/images/Huella_Petlove.png';

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
            <button className="btn-primary btn-hero" onClick={() => navigate('/login')}>
              Iniciar sesión
            </button>
            <span className="icon-static" aria-hidden="true">
              <FaUser size={18} />
            </span>
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
            <article className="blog-card blog-card-detail" style={{ maxWidth: 900, margin: '0 auto' }}>
              <div className="blog-thumb" style={{ maxWidth: 420, margin: '0 auto', position: 'relative' }}>
                <div className="brand-badge">
                  <img src={logoImg} alt="Pet Love" />
                </div>
                <img src={displayImage} alt={post.title} loading="lazy" style={{ width: '100%', display: 'block', borderRadius: 12 }} />
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

export default BlogDetalle;

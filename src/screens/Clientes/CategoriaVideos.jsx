import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import categoriasService from '../../services/categoriasService';
import imageService from '../../services/imageService';
import pexelsService from '../../services/pexelsService';
import './ClientesLanding.scss';

const slugToNombre = (slug) => {
  if (!slug) return 'general';
  const nombre = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
  return nombre;
};

const CategoriaVideos = () => {
  const { categoria: categoriaSlug } = useParams();
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fallbackImages, setFallbackImages] = useState([]);
  const [servicesStatus, setServicesStatus] = useState({});

  const categoriaPetlove = useMemo(() => {
    const base = (categoriaSlug || 'general')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ñ/g, 'n');

    // 1) Intentar usar el slug exacto si existe en Pexels como categoría específica
    try {
      const disponibles = pexelsService.getAvailableCategories?.() || [];
      const slugNormalizado = String(base)
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      if (disponibles.includes(slugNormalizado)) {
        return slugNormalizado;
      }
    } catch {}

    // 2) Si no existe, mapear a las categorías generales
    if (/(alimenta|snack|comida)/i.test(base)) return 'alimentacion';
    if (/(juguet)/i.test(base)) return 'juguetes';
    if (/(higien|arena|baño|aseo)/i.test(base)) return 'higiene';
    if (/(accesor|correa|arnes|ropa)/i.test(base)) return 'accesorios';
    if (/(salud|vet|veterin)/i.test(base)) return 'salud';
    return 'general';
  }, [categoriaSlug]);

  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const cats = await categoriasService.obtenerCategorias();
        const lista = (cats || []).map((c, i) => {
          const nombre = c.nombre ?? c.Nombre ?? (typeof c === 'string' ? c : 'Categoría');
          const slug = String(nombre)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/ñ/g, 'n')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          return { id: c.id ?? i + 1, nombre, slug };
        });
        setCategorias(lista);
      } catch (e) {
        setCategorias([]);
      }
    };
    cargarCategorias();
  }, []);

  useEffect(() => {
    // Verificar servicios configurados (para mostrar mensajes dinámicos)
    try {
      setServicesStatus(imageService.getServicesStatus());
    } catch (e) {
      setServicesStatus({});
    }
  }, []);

  useEffect(() => {
    const cargarVideos = async () => {
      try {
        setLoading(true);
        setFallbackImages([]);
        const resultado = await imageService.getVideos(categoriaPetlove, { perPage: 8 });
        const listaVideos = resultado || [];
        setVideos(listaVideos?.slice(0, 8));

        // Si no hay videos (por falta de API key o resultados), cargar imágenes como alternativa
        if ((listaVideos || []).length === 0) {
          const imgs = await imageService.getAllImages(categoriaPetlove, { perPage: 8 });
          setFallbackImages(imgs || []);
        }
      } catch (e) {
        setVideos([]);
        const imgs = await imageService.getAllImages(categoriaPetlove, { perPage: 8 });
        setFallbackImages(imgs || []);
      } finally {
        setLoading(false);
      }
    };
    cargarVideos();
  }, [categoriaPetlove]);

  const seleccionarArchivo = (video) => {
    // Elegir el archivo MP4 con calidad media/alta
    const files = video?.videoFiles || video?.video_files || [];
    const byQuality = files.sort((a, b) => (a.height || 0) - (b.height || 0));
    const prefer = byQuality.find(f => /mp4/i.test(f.fileType || f.file_type)) || byQuality[0];
    return prefer?.link || '';
  };

  return (
    <div className="categoria-videos-page pet-love-landing minimal" style={{ background: '#ffffff', minHeight: '100vh' }}>
      {/* Header común */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🐾</span>
            <span className="logo-text">Pet Love</span>
          </div>
          <nav className="nav-menu">
            <a href="#inicio" onClick={(e) => { e.preventDefault(); }}>
              <span>Inicio</span>
              <div className="nav-indicator"></div>
            </a>
            <a href="/donde-comprar" onClick={(e) => { e.preventDefault(); navigate('/donde-comprar'); }}>
              <span>¿Dónde comprar?</span>
              <div className="nav-indicator"></div>
            </a>
            <a href="/productos-tienda" onClick={(e) => { e.preventDefault(); navigate('/productos-tienda'); }}>
              <span>Productos</span>
              <div className="nav-indicator"></div>
            </a>
            <a href="/blog" onClick={(e) => { e.preventDefault(); navigate('/blog'); }}>
              <span>Blog</span>
              <div className="nav-indicator"></div>
            </a>
          </nav>
          <div className="header-actions">
            <button className="icon-button" onClick={() => navigate('/login')} aria-label="Cuenta">
              <FaUser size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="videos-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '120px 24px 24px' }}>
        <div className="videos-header" style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontWeight: 900 }}>Videos: {slugToNombre(categoriaSlug)}</h2>
          <p style={{ color: '#6b7280', margin: '6px 0 0' }}>Explora contenido visual de nuestras categorías</p>
          {!servicesStatus?.pexels && (
            <div style={{ marginTop: 8, padding: 10, background: '#fff8e1', border: '1px solid #fde68a', borderRadius: 8, color: '#92400e' }}>
              Nota: los videos requieren configurar <strong>Pexels API</strong>. Mostramos imágenes como alternativa.
            </div>
          )}
        </div>

        <div className="videos-layout" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16 }}>
          <aside className="videos-sidebar" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Categorías</div>
            <button
              onClick={() => navigate('/videos-categoria/general')}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', marginBottom: 6 }}
            >
              Todo
            </button>
            {(categorias || []).map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/videos-categoria/${c.slug || 'general'}`)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', marginBottom: 6 }}
              >
                {c.nombre}
              </button>
            ))}
          </aside>

          <main className="videos-main" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
            {loading ? (
              <div style={{ padding: 16 }}>Cargando contenido...</div>
            ) : (
              <div className="videos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {(videos || []).map((video) => (
                  <div key={video.id} className="video-card" style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                    {seleccionarArchivo(video) ? (
                      <video src={seleccionarArchivo(video)} controls poster={video.image} style={{ width: '100%', display: 'block' }} />
                    ) : (
                      <img src={video.image} alt="Video" style={{ width: '100%', display: 'block' }} />
                    )}
                    <div style={{ padding: 8 }}>
                      <div style={{ fontWeight: 700 }}>Duración: {video.duration}s</div>
                      <div style={{ color: '#6b7280' }}>Fuente: Pexels</div>
                    </div>
                  </div>
                ))}

                {(videos || []).length === 0 && (fallbackImages || []).map((img) => (
                  <div key={img.id} className="video-card" style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                    <img src={img.url} alt={img.description || 'Imagen'} style={{ width: '100%', display: 'block' }} />
                    <div style={{ padding: 8 }}>
                      <div style={{ fontWeight: 700 }}>Imagen alternativa</div>
                      <div style={{ color: '#6b7280' }}>Fuente: {img.source?.toUpperCase?.() || 'Imagen'}</div>
                    </div>
                  </div>
                ))}

                {(videos || []).length === 0 && (fallbackImages || []).length === 0 && (
                  <div style={{ padding: 16, color: '#6b7280' }}>Sin resultados por ahora. Intenta con otra categoría.</div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer común */}
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

export default CategoriaVideos;

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import CarritoCompras from '../../components/Carrito/CarritoCompras';
import { useAuth } from '../../features/auth/hooks/useAuth';
import productosService from '../../services/productosService';
import imageApiService from '../../services/imageApiService';
import Swal from 'sweetalert2';
// Eliminadas dependencias de backend del carrito
import OptimizedImage from '../../components/common/OptimizedImage';
import { API_BASE_URL } from '../../constants/apiConstants';
import { formatPriceCL } from '../../Utils/priceUtils';
import './ProductosLanding.scss';
import './ClientesLanding-animations.scss';
import logoImg from '../../assets/images/Huella_Petlove.png';

const ProductosLanding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, permisos } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');
  const [filtroPrecio, setFiltroPrecio] = useState('Todos');
  const [precioPersonalizado, setPrecioPersonalizado] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [notificacion, setNotificacion] = useState({ visible: false, mensaje: '', producto: null });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [galeriaModal, setGaleriaModal] = useState({ open: false, imagenes: [], producto: null });
  
  // Estados para imágenes de Unsplash
  const [productImages, setProductImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);
  useEffect(() => {
    try {
      const s1 = localStorage.getItem('pl.busqueda');
      if (s1 !== null) setBusqueda(s1);
      const s2 = localStorage.getItem('pl.filtroCategoria');
      if (s2 !== null) setFiltroCategoria(s2);
      const s3 = localStorage.getItem('pl.filtroPrecio');
      if (s3 !== null) setFiltroPrecio(s3);
      const s4 = localStorage.getItem('pl.precioPersonalizado');
      if (s4 !== null) setPrecioPersonalizado(s4);
      const s5 = localStorage.getItem('pl.carrito');
      if (s5) {
        const parsed = JSON.parse(s5);
        if (Array.isArray(parsed)) setCarrito(parsed);
      }
      const s6 = localStorage.getItem('pl.carritoAbierto');
      if (s6 !== null) setCarritoAbierto(s6 === 'true');
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('pl.busqueda', busqueda);
    } catch {}
  }, [busqueda]);
  useEffect(() => {
    try {
      localStorage.setItem('pl.filtroCategoria', filtroCategoria);
    } catch {}
  }, [filtroCategoria]);
  useEffect(() => {
    try {
      localStorage.setItem('pl.filtroPrecio', filtroPrecio);
    } catch {}
  }, [filtroPrecio]);
  useEffect(() => {
    try {
      localStorage.setItem('pl.precioPersonalizado', precioPersonalizado);
    } catch {}
  }, [precioPersonalizado]);
  useEffect(() => {
    try {
      localStorage.setItem('pl.carrito', JSON.stringify(carrito));
    } catch {}
  }, [carrito]);
  useEffect(() => {
    try {
      localStorage.setItem('pl.carritoAbierto', String(carritoAbierto));
    } catch {}
  }, [carritoAbierto]);

  // Catálogo desde backend
  const [productos, setProductos] = useState([]);

  // Formateador de precios compartido desde utils

  // Iconos según categoría (detecta alimentos para gato, medicina, vestimenta, etc.)
  const getCategoriaIcon = (categoria = '', nombre = '') => {
    const c = String(categoria).toLowerCase();
    const n = String(nombre).toLowerCase();
    const isCat = c.includes('gato') || c.includes('felino') || n.includes('gato') || n.includes('felino') || n.includes('cat');
    if (c.includes('aliment')) {
      return isCat ? '🐱🍖' : '🍖';
    }
    if (c.includes('medic') || c.includes('salud')) return '💊';
    if (c.includes('higiene')) return '🧼';
    if (c.includes('juguet')) return '🎾';
    if (c.includes('vest') || c.includes('ropa')) return '🧥';
    if (c.includes('accesor')) return '🎀';
    if (c.includes('cuidado')) return '🧴';
    return '🐾';
  };

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const lista = await productosService.obtenerProductos();
        const normalizados = (lista || []).map(p => {
          const categoriaNombre = (
            p?.Categoria?.Nombre ??
            p?.categoria?.Nombre ??
            p?.categoria?.nombre ??
            (typeof p?.categoria === 'string' ? p.categoria : null) ??
            'Sin categoría'
          );
          const precioOriginal = p?.Precio ?? p?.precio ?? 0;
          return {
            id: p.Id ?? p.id,
            nombre: p.Nombre ?? p.nombre,
            descripcion: (p.Descripcion ?? p.descripcion ?? '').toString(),
            precioNumerico: parseFloat(precioOriginal) || 0,
            precio: formatPriceCL(precioOriginal),
            stock: p.Stock ?? p.stock ?? 0,
            activo: p.Activo ?? p.activo ?? true,
            categoria: categoriaNombre,
            imagenUrl: p.ImagenUrl ?? p.imagenUrl ?? null,
            imagen: '🐾'
          };
        });
        setProductos(normalizados);
      } catch (e) {
        console.warn('No se pudieron cargar productos del backend:', e);
      }
    };
    cargarProductos();
  }, []);

  // Rangos de precios para el filtro
  const rangosPrecios = [
    { value: 'Todos', label: 'Todos los precios' },
    { value: '0-20000', label: 'Hasta $20.000' },
    { value: '20000-50000', label: '$20.000 - $50.000' },
    { value: '50000-100000', label: '$50.000 - $100.000' },
    { value: '100000-200000', label: '$100.000 - $200.000' },
    { value: '200000+', label: 'Más de $200.000' }
  ];

  const cerrarSesion = async () => {
    await logout();
    navigate('/');
  };

  const volverAModulos = () => {
    try {
      const role = (user?.role || '').trim();
      const perms = Array.isArray(permisos) ? permisos : [];
      if (perms.includes('VerDashboard') && (role === 'Administrador' || role === 'Asistente')) {
        navigate('/dashboard');
        return;
      }
      const mapping = [
        ['GestionUsuarios','/usuarios'],
        ['GestionProductos','/productos'],
        ['GestionCategorias','/categorias'],
        ['GestionMarcas','/marcas'],
        ['GestionMedidas','/medidas'],
        ['GestionProveedores','/proveedores'],
        ['GestionClientes','/clientes'],
        ['GestionCompras','/compras'],
        ['GestionPedidos','/pedidos'],
        ['GestionRoles','/roles'],
        ['GestionVentas','/ventas'],
      ];
      const target = mapping.find(([perm]) => perms.includes(perm))?.[1];
      navigate(target || '/mi-cuenta');
    } catch {
      navigate('/mi-cuenta');
    }
  };

  const agregarAlCarrito = async (producto) => {
    // Verificar estado y stock
    if (!producto.activo || producto.stock <= 0) {
      mostrarNotificacion(`${producto.nombre} no está disponible`, producto);
      return;
    }

    const productoEnCarrito = carrito.find(item => item.id === producto.id);
    const cantidadActual = productoEnCarrito ? productoEnCarrito.cantidad : 0;
    
    if (cantidadActual >= producto.stock) {
      mostrarNotificacion(`Solo hay ${producto.stock} unidades disponibles`, producto);
      return;
    }
    
    // Actualizar carrito local
    if (productoEnCarrito) {
      setCarrito(carrito.map(item =>
        item.id === producto.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
    
    // Sincronización con backend deshabilitada
    
    mostrarNotificacion(`${producto.nombre} agregado al carrito`, producto);
  };

  const mostrarNotificacion = (mensaje, producto) => {
    setNotificacion({ visible: true, mensaje, producto });
    setTimeout(() => {
      setNotificacion({ visible: false, mensaje: '', producto: null });
    }, 3000);
  };
  const verDescripcionRapida = (producto) => {
    const nombre = producto?.nombre || 'Producto';
    const descripcion = (producto?.descripcion || '').toString().trim() || 'Sin descripción';
    const precio = formatPriceCL(producto?.precioNumerico || producto?.precio || 0);
    const categoria = producto?.categoria || '—';
    const stock = Number(producto?.stock ?? 0);
    const estado = (!producto?.activo) ? 'Inactivo' : (stock <= 0) ? 'Sin stock' : 'Disponible';
    const html = `
      <div style="text-align:left;line-height:1.6">
        <div style="font-weight:700;margin-bottom:.5rem;color:#1f2937">${nombre}</div>
        <div style="margin-bottom:1rem;color:#334155">${descripcion}</div>
        <div style="display:flex;gap:1rem;margin-bottom:.5rem;">
          <div><span style="font-weight:600;color:#1f2937">Precio:</span> ${precio}</div>
          <div><span style="font-weight:600;color:#1f2937">Categoría:</span> ${categoria}</div>
        </div>
        <div><span style="font-weight:600;color:#1f2937">Estado:</span> ${estado} <span style="color:#6b7280">(stock ${stock})</span></div>
      </div>
    `;
    Swal.fire({
      icon: 'info',
      title: 'Vista rápida',
      html,
      confirmButtonText: 'Cerrar'
    });
  };

  // Abrir carrito mediante hash o query param
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const shouldOpen = params.get('carrito') === 'open' || (typeof window !== 'undefined' && window.location.hash === '#carrito');
      if (shouldOpen) {
        setCarritoAbierto(true);
      }
      // Scroll a catálogo si hash corresponde
      if (typeof window !== 'undefined' && window.location.hash === '#productos') {
        scrollToSection('productos');
      }
    } catch (e) {
      // No bloquear si falla lectura
      console.warn('No se pudo leer parámetros de navegación:', e);
    }
  }, [location.search]);

  const filtrarProductos = () => {
    return productos.filter(producto => {
      const cumpleBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                            producto.descripcion.toLowerCase().includes(busqueda.toLowerCase());
     
      const cumpleCategoria = filtroCategoria === 'Todos' || producto.categoria === filtroCategoria;
      
      let cumplePrecio = true;
      if (filtroPrecio !== 'Todos') {
        const precio = producto.precioNumerico;
        switch (filtroPrecio) {
          case 'Menos de $20.000':
            cumplePrecio = precio < 20000;
            break;
          case '$20.000 - $50.000':
            cumplePrecio = precio >= 20000 && precio <= 50000;
            break;
          case '$50.000 - $100.000':
            cumplePrecio = precio >= 50000 && precio <= 100000;
            break;
          case 'Más de $100.000':
            cumplePrecio = precio > 100000;
            break;
          case 'Personalizado':
            if (precioPersonalizado) {
              cumplePrecio = precio <= parseInt(precioPersonalizado);
            }
            break;
        }
      }
      
      return cumpleBusqueda && cumpleCategoria && cumplePrecio;
    });
  };

  const productosFiltrados = filtrarProductos();
  const categorias = ['Todos', ...new Set((productos || []).map(p => p.categoria))];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Función para obtener imagen específica por producto
  const getProductImage = (producto, index) => {
    // Priorizar imagenUrl del producto si existe
    const rawUrl = producto?.imagenUrl;
    if (rawUrl) {
      const url = buildImageSrc(rawUrl);
      return {
        id: `product-${producto.id}`,
        url,
        thumbnail: url,
        productId: producto.id,
        productName: producto.nombre,
        title: producto.nombre
      };
    }

    // Si no hay imagenUrl, usar lógica previa de imágenes por categoría
    if (productImages.length === 0) return null;

    // Buscar imagen específica para este producto por ID
    const specificImage = productImages.find(img => img.productId === producto.id);
    if (specificImage) {
      return specificImage;
    }

    // Fallback: mapear categorías a rangos de imágenes específicos
    const categoryImageMap = {
      'Alimentación': productImages.slice(0, 4),
      'Juguetes': productImages.slice(4, 8),
      'Accesorios': productImages.slice(8, 12),
      'Higiene': productImages.slice(12, 16),
      'Salud': productImages.slice(16, 20),
      'Cuidado': productImages.slice(20, 24)
    };

    const categoryImages = categoryImageMap[producto.categoria] || productImages;
    if (categoryImages.length === 0) return productImages[index % productImages.length];

    // Usar el ID del producto para obtener una imagen consistente
    const imageIndex = producto.id % categoryImages.length;
    return categoryImages[imageIndex];
  };

  const loadApiImages = async () => {
    try {
      setLoadingImages(true);
      let fetched = await imageApiService.getImages('unsplash', { count: 24, query: 'cute pet OR dog OR cat', width: 800, height: 600 });
      if (!Array.isArray(fetched) || fetched.length < 24) {
        const extra = await imageApiService.getImages('pets', { count: 24 });
        const combined = [...(fetched || []), ...(extra || [])];
        fetched = combined.slice(0, 24);
      }

      const productImagesData = (fetched || []).map((img, idx) => ({
        id: `product-auto-${idx}`,
        url: img.url,
        thumbnail: img.thumbnail || img.url,
      }));
      setProductImages(productImagesData);
    } catch (error) {
      const petsFallback = await imageApiService.getImages('pets', { count: 24 });
      const productImagesData = (petsFallback || []).map((img, idx) => ({
        id: `product-fallback-${idx}`,
        url: img.url,
        thumbnail: img.thumbnail || img.url,
      }));
      setProductImages(productImagesData);
    } finally {
      setLoadingImages(false);
    }
  };

  // Cargar imágenes al montar el componente
  useEffect(() => {
    loadApiImages();
  }, []);

  // Seguimiento del mouse para efectos parallax
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

  // Loading screen similar to ClientesLanding
  if (loadingImages) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner">
            <div className="paw-print">🐾</div>
          </div>
          <h2>Cargando las mejores imágenes de Pet Love...</h2>
          <p>Preparando los mejores productos para ti</p>
        </div>
      </div>
    );
  }



  return (
    <motion.div 
      className="productos-landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Cursor personalizado */}
      <div 
        className="custom-cursor"
        style={{
          left: `${mousePosition.x}%`,
          top: `${mousePosition.y}%`
        }}
      >
        🐾
      </div>

      {/* Notificación de producto agregado */}
      {notificacion.visible && (
        <motion.div 
          className="notificacion-carrito"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
        >
          <div className="notificacion-contenido">
            <div className="notificacion-icono">✅</div>
            <div className="notificacion-mensaje">{notificacion.mensaje}</div>
          </div>
        </motion.div>
      )}
      
      {/* Header mejorado */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <img src={logoImg} alt="Pet Love" className="logo-img" />
            <span className="logo-text">Pet Love</span>
            <div className="logo-glow"></div>
          </div>
          <nav className="nav-menu">
            {/* Orden: Inicio, ¿Dónde comprar?, Nosotros, Productos, Comunidad, Blog. Ocultamos el actual (Productos). */}
            <a href="/" onClick={(e) => { e.preventDefault(); const path = '/'; if (location.pathname !== path) navigate(path); }}>
              <span>Inicio</span>
              <div className="nav-indicator"></div>
            </a>
            <a href="/donde-comprar" onClick={(e) => { e.preventDefault(); const path = '/donde-comprar'; if (location.pathname !== path) navigate(path); }}>
              <span>¿Dónde comprar?</span>
              <div className="nav-indicator"></div>
            </a>
            <a href="/" onClick={(e) => { e.preventDefault(); const path = '/'; if (location.pathname !== path) navigate(path); }}>
              <span>Nosotros</span>
              <div className="nav-indicator"></div>
            </a>
            <a href="/blog" onClick={(e) => { e.preventDefault(); const path = '/blog'; if (!location.pathname.startsWith(path)) navigate(path); }}>
              <span>Blog</span>
              <div className="nav-indicator"></div>
            </a>
          </nav>
          <div className="header-actions">
            <button
              className="icon-button decorativo"
              aria-label="Cuenta"
              title="Cuenta"
            >
              <FaUser size={18} />
            </button>
            {isAuthenticated && (
              <button className="btn-outline volver-modulos-btn" onClick={volverAModulos} title="Volver a Módulos">
                Volver a Módulos
              </button>
            )}
            {isAuthenticated && (
              <button className="btn-secondary cerrar-sesion-btn" onClick={cerrarSesion} title="Cerrar sesión">
                Cerrar sesión
              </button>
            )}
            <button 
              className="carrito-toggle"
              onClick={() => setCarritoAbierto(!carritoAbierto)}
              title={`Carrito (${carrito.reduce((total, item) => total + item.cantidad, 0)} productos)`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/>
              </svg>
              <span className="carrito-contador" aria-label="items en carrito">
                {carrito.reduce((total, item) => total + item.cantidad, 0)}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Se eliminó la sección hero inicial para ir directo a productos */}

      {/* Productos Section */}
      <section id="productos" className="productos-section">
        <div className="section-header">
          <h2>Nuestros Productos</h2>
          <p>Explora nuestra selección cuidadosamente elegida de productos para mascotas</p>
        </div>

        {/* Filtros Profesionales */}
        <div className="filtros-profesionales">
          <div className="filtros-container-profesional">
            {/* Barra de Búsqueda Mejorada */}
            <div className="busqueda-avanzada">
              <div className="search-box-profesional">
                <div className="search-icon">🔍</div>
                <input
                  type="text"
                  className="search-input-profesional"
                  placeholder="Buscar productos..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
                {busqueda && (
                  <button 
                    className="clear-search"
                    onClick={() => setBusqueda('')}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Filtros por Categoría */}
            <motion.div 
              className="categoria-filtros"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <h3 className="filtro-titulo">Categorías</h3>
              <div className="categoria-grid">
                {categorias.map((categoria, index) => (
                  <motion.button
                    key={categoria}
                    className={`categoria-btn ${filtroCategoria === categoria ? 'active' : ''}`}
                    onClick={() => setFiltroCategoria(categoria)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 1.2 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="categoria-icono">
                      {categoria === 'Todos' ? '🏪' : getCategoriaIcon(categoria)}
                    </span>
                    <span className="categoria-texto">{categoria}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Filtros de Precio */}
            <motion.div 
              className="precio-filtros-profesional"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
            >
              <h3 className="filtro-titulo">Rango de Precio</h3>
              <div className="precio-opciones">
                <select
                  className="precio-select-profesional"
                  value={filtroPrecio}
                  onChange={(e) => setFiltroPrecio(e.target.value)}
                >
                  {rangosPrecios.map(rango => (
                    <option key={rango.value} value={rango.value}>
                      {rango.label}
                    </option>
                  ))}
                  <option value="personalizado">Precio Personalizado</option>
                </select>

                {filtroPrecio === 'personalizado' && (
                  <div className="precio-personalizado-profesional">
                    <div className="precio-input-container">
                      <span className="precio-simbolo">$</span>
                      <input
                        type="number"
                        placeholder="Precio máximo"
                        value={precioPersonalizado}
                        onChange={(e) => setPrecioPersonalizado(e.target.value)}
                        className="precio-input-profesional"
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Contador de Resultados */}
            <div className="resultados-contador">
              <span className="contador-texto">
                {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''} encontrado{productosFiltrados.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Grid de Productos Profesional */}
        <motion.div 
          className="productos-grid-profesional"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.6 }}
        >
          <AnimatePresence>
            {productosFiltrados.map((producto, index) => (
                <motion.div
                  key={producto.id}
                  className="producto-card-profesional"
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -50, scale: 0.9 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 1.8 + index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    y: -10, 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  layout
                >
                  <div className="producto-imagen-profesional" onClick={async () => {
                    // Abrir galería al hacer clic en la imagen del producto
                    try {
                      // Preferir nueva clave por producto, luego compatibilidad con clave antigua
                      const keyNueva = `product-gallery:${producto.id}`;
                      const arrNueva = JSON.parse(localStorage.getItem(keyNueva) || '[]');
                      const galeriasAntiguas = JSON.parse(localStorage.getItem('productoGalerias') || '{}');
                      const extrasAntiguas = Array.isArray(galeriasAntiguas[producto.id]) ? galeriasAntiguas[producto.id] : [];
                      const extras = Array.isArray(arrNueva) && arrNueva.length > 0 ? arrNueva : extrasAntiguas;

                      const principal = producto?.imagenUrl ? [buildImageSrc(producto.imagenUrl)].filter(Boolean) : [];
                      let imagenes = [...principal, ...extras.map(buildImageSrc)].filter(Boolean);
                      if (imagenes.length === 0) {
                        const fetched = await imageApiService.getProductImagesByCategory(producto.categoria, 6);
                        imagenes = (fetched || []).map(img => img.url).slice(0, 6);
                      }

                      setGaleriaModal({ open: true, imagenes, producto });
                    } catch (e) {
                      console.warn('No se pudo abrir la galería del producto:', e);
                    }
                  }}>
                    {(() => {
                      const productImage = getProductImage(producto, index);
                      return productImage ? (
                        <OptimizedImage
                          src={productImage.url}
                          alt={productImage.title || producto.nombre}
                          className="producto-background-image"
                          quality="high"
                          sizes="300px"
                          aspectRatio="4/3"
                          objectFit="cover"
                        />
                      ) : (
                        <div className="producto-emoji-fallback">{producto.imagen}</div>
                      );
                    })()}
                  
                    <div className="producto-categoria-profesional">
                      <span className="categoria-icono-small">
                        {getCategoriaIcon(producto.categoria, producto.nombre)}
                      </span>
                      {producto.categoria}
                    </div>
                    
                    {/* Badge 'Destacado' eliminado según solicitud del cliente */}
                    
                    {/* Badge de stock eliminado: el stock se mostrará junto a "Disponible" en la info */}

                    <div className="producto-acciones-rapidas">
                      <button className="accion-vista-rapida" title="Vista rápida" aria-label="Vista rápida" onClick={() => verDescripcionRapida(producto)}>
                        👁️
                      </button>
                    </div>
                  </div>
                
                <div className="producto-info-profesional">
                  <div className="producto-header">
                    <h3 className="producto-nombre-profesional">
                      {producto.nombre}
                    </h3>
                  </div>
                  
                  <p className="producto-descripcion-profesional">{producto.descripcion}</p>
                  
                  <div className="producto-footer">
                    <div className="producto-precio-profesional">
                      <span className="precio-actual">{producto.precio}</span>
                    </div>
                    
                    <button 
                      className="btn-producto-profesional"
                      onClick={() => agregarAlCarrito(producto)}
                      disabled={!producto.activo || producto.stock <= 0}
                      title={!producto.activo ? 'Producto inactivo' : (producto.stock <= 0 ? 'Sin stock' : 'Agregar al carrito')}
                    >
                      <span className="btn-icono">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/>
                        </svg>
                      </span>
                      <span className="btn-texto">Agregar</span>
                    </button>
                  </div>
                  
                  {/* Estado dinámico del producto y stock junto a Disponible */}
                  <div className="producto-caracteristicas">
                    {(!producto.activo) ? (
                      <div className="caracteristica" title="Producto inactivo">
                        <span className="caracteristica-icono">🚫</span>
                        <span className="caracteristica-texto">Inactivo</span>
                      </div>
                    ) : (producto.stock <= 0) ? (
                      <div className="caracteristica" title="Producto sin stock">
                        <span className="caracteristica-icono">⛔</span>
                        <span className="caracteristica-texto">Sin stock</span>
                      </div>
                    ) : (
                      <div className="caracteristica" title="Producto disponible">
                        <span className="caracteristica-icono">📦</span>
                        <span className="caracteristica-texto">Disponible</span>
                        <span className="stock-inline">{producto.stock} stock</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
              ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Footer */}
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

      {/* Componente del Carrito */}
      <CarritoCompras 
        isOpen={carritoAbierto}
        onClose={() => setCarritoAbierto(false)}
        carrito={carrito}
        setCarrito={setCarrito}
      />

      {/* Modal de galería de imágenes del producto */}
      {galeriaModal?.open && (
        <div className="galeria-modal" role="dialog" aria-modal="true">
          <div className="galeria-backdrop" onClick={() => setGaleriaModal({ open: false, imagenes: [], producto: null })} />
          <div className="galeria-content">
            <div className="galeria-header">
              <h3 className="galeria-title">{galeriaModal.producto?.nombre || 'Imágenes del producto'}</h3>
              <button className="galeria-close" onClick={() => setGaleriaModal({ open: false, imagenes: [], producto: null })} title="Cerrar">✖</button>
            </div>
            <div className="galeria-body">
              <div className="galeria-viewer">
                <img
                  src={
                    galeriaModal.producto?.imagenUrl
                      ? buildImageSrc(galeriaModal.producto.imagenUrl)
                      : (galeriaModal.imagenes?.[0] || '')
                  }
                  alt={galeriaModal.producto?.nombre || 'Imagen del producto'}
                  className="galeria-main-image"
                />
              </div>
              <div className="galeria-info">
                <div className="info-precio">
                  <span className="label">Precio</span>
                  <span className="valor">{galeriaModal.producto?.precio}</span>
                </div>
                <div className="info-categoria">
                  <span className="label">Categoría</span>
                  <span className="valor">{galeriaModal.producto?.categoria || '—'}</span>
                </div>
                <div className="info-stock">
                  <span className="label">Stock</span>
                  <span className="valor">{galeriaModal.producto?.stock}</span>
                </div>
                <div className="info-estado">
                  <span className="label">Estado</span>
                  <span className="valor">{(!galeriaModal.producto?.activo) ? 'Inactivo' : (galeriaModal.producto?.stock <= 0) ? 'Sin stock' : 'Disponible'}</span>
                </div>
                <div className="info-descripcion">
                  <span className="label">Descripción</span>
                  <p className="texto">{galeriaModal.producto?.descripcion || 'Sin descripción'}</p>
                </div>
                <div className="info-acciones">
                  <button className="btn-agregar-modal" onClick={() => { agregarAlCarrito(galeriaModal.producto); setGaleriaModal({ open: false, imagenes: [], producto: null }); }}>Agregar al carrito</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProductosLanding;
  // Helper para construir src absoluto desde API cuando es ruta relativa
  const buildImageSrc = (url) => {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    const path = url.startsWith('/') ? url : `/${url}`;
    const base = import.meta.env?.DEV
      ? (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8091').replace(/\/$/, '')
      : API_BASE_URL;
    return `${base}${path}`;
  };

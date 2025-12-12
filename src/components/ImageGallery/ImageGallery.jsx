import React, { useState, useEffect } from 'react';
import imageService from '../../services/imageService';
import './ImageGallery.css';

const ImageGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [selectedService, setSelectedService] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [contentType, setContentType] = useState('photos');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [servicesStatus, setServicesStatus] = useState({});

  // Categorías específicas de PetLove
  const categories = [
    { id: 'general', name: '🐾 Todas (General)', description: 'Mascotas en general' },
    { id: 'alimentacion', name: '🍖 Alimentación', description: 'Comida y nutrición para mascotas' },
    { id: 'juguetes', name: '🎾 Juguetes', description: 'Juguetes y entretenimiento' },
    { id: 'accesorios', name: '🎀 Accesorios', description: 'Collares, correas y accesorios' },
    { id: 'higiene', name: '🧼 Higiene', description: 'Baño y cuidado personal' },
    { id: 'salud', name: '❤️ Salud', description: 'Veterinaria y cuidados médicos' }
  ];

  // Servicios disponibles
  const services = [
    { id: 'all', name: 'Todos los servicios', description: 'Combina Unsplash, Pexels y Pixabay' },
    { id: 'unsplash', name: 'Unsplash', description: 'Fotos de alta calidad' },
    { id: 'pexels', name: 'Pexels', description: 'Fotos y videos gratuitos' },
    { id: 'pixabay', name: 'Pixabay', description: 'Fotos, ilustraciones e íconos' }
  ];

  // Tipos de contenido
  const contentTypes = [
    { id: 'photos', name: '📷 Fotos', description: 'Fotografías' },
    { id: 'videos', name: '🎥 Videos', description: 'Solo disponible en Pexels' },
    { id: 'illustrations', name: '🎨 Ilustraciones', description: 'Solo disponible en Pixabay' },
    { id: 'icons', name: '🔸 Íconos', description: 'Solo disponible en Pixabay' }
  ];

  // Tipos de imagen para Pixabay
  const imageTypes = [
    { id: 'photo', name: '📷 Fotos', description: 'Fotografías reales' },
    { id: 'illustration', name: '🎨 Ilustraciones', description: 'Arte digital y dibujos' },
    { id: 'vector', name: '📐 Vectores', description: 'Íconos y gráficos vectoriales' }
  ];

  // Cargar imágenes
  const loadImages = async (resetImages = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let result = [];
      const currentPage = resetImages ? 1 : page;
      const options = { perPage: 20 };

      if (searchTerm.trim()) {
        // Búsqueda
        if (selectedService === 'all') {
          result = await imageService.searchAllServices(searchTerm, options);
        } else {
          result = await imageService.searchInService(selectedService, searchTerm, options);
        }
      } else {
        // Por categoría y tipo de contenido
        switch (contentType) {
          case 'photos':
            if (selectedService === 'all') {
              result = await imageService.getAllImages(selectedCategory, options);
            } else {
              result = await imageService.getImagesFromService(selectedService, selectedCategory, options);
            }
            break;
            
          case 'videos':
            if (selectedService === 'pexels' || selectedService === 'all') {
              result = await imageService.getVideos(selectedCategory, options);
            }
            break;
            
          case 'illustrations':
            if (selectedService === 'pixabay' || selectedService === 'all') {
              result = await imageService.getIllustrations(selectedCategory, options);
            }
            break;
            
          case 'icons':
            if (selectedService === 'pixabay' || selectedService === 'all') {
              result = await imageService.getIcons(selectedCategory, options);
            }
            break;
        }
      }

      // Normalizar datos
      const normalizedImages = result.map(img => imageService.normalizeImageData(img));

      if (resetImages) {
        setImages(normalizedImages);
        setPage(2);
      } else {
        setImages(prev => [...prev, ...normalizedImages]);
        setPage(prev => prev + 1);
      }

      setHasMore(normalizedImages.length === options.perPage);
      
    } catch (error) {
      console.error('Error loading images:', error);
      setError('Error al cargar las imágenes. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Verificar estado de servicios
  const checkServicesStatus = async () => {
    try {
      const status = imageService.getServicesStatus();
      setServicesStatus(status);
    } catch (error) {
      console.error('Error checking services status:', error);
    }
  };

  // Efectos
  useEffect(() => {
    checkServicesStatus();
    loadImages(true);
  }, [selectedCategory, selectedService, contentType]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const timeoutId = setTimeout(() => {
        loadImages(true);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      loadImages(true);
    }
  }, [searchTerm]);

  // Manejadores de eventos
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setSearchTerm('');
    setPage(1);
  };

  const handleServiceChange = (serviceId) => {
    setSelectedService(serviceId);
    setPage(1);
  };

  const handleContentTypeChange = (type) => {
    setContentType(type);
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadImages(true);
  };

  const handleLoadMore = () => {
    loadImages(false);
  };

  const handleDownload = async (image) => {
    try {
      await imageService.downloadImage(image);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Error al descargar la imagen');
    }
  };

  const handleImageClick = (image) => {
    if (image.source === 'pexels' && image.pexelsUrl) {
      window.open(image.pexelsUrl, '_blank');
    } else if (image.source === 'unsplash' && image.authorUrl) {
      window.open(image.authorUrl, '_blank');
    } else if (image.source === 'pixabay' && image.authorUrl) {
      window.open(image.authorUrl, '_blank');
    }
  };

  // Verificar si el tipo de contenido es compatible con el servicio seleccionado
  const isContentTypeAvailable = (type) => {
    if (selectedService === 'all') return true;
    if (type === 'photos') return true;
    if (type === 'videos') return selectedService === 'pexels';
    if (type === 'illustrations' || type === 'icons') return selectedService === 'pixabay';
    return false;
  };

  // Obtener información del autor
  const getAuthorInfo = (image) => {
    switch (image.source) {
      case 'unsplash':
        return {
          name: image.author || 'Autor desconocido',
          url: image.authorUrl,
          platform: 'Unsplash'
        };
      case 'pexels':
        return {
          name: image.photographer || 'Fotógrafo desconocido',
          url: image.photographerUrl,
          platform: 'Pexels'
        };
      case 'pixabay':
        return {
          name: image.author || 'Autor desconocido',
          url: image.authorUrl,
          platform: 'Pixabay'
        };
      default:
        return {
          name: 'Autor desconocido',
          url: null,
          platform: 'Desconocido'
        };
    }
  };

  // Obtener estadísticas del servicio
  const getServiceStats = () => {
    return imageService.getUsageStats();
  };

  /**
   * Obtiene el ícono del servicio
   */
  const getServiceIcon = (source) => {
    switch (source) {
      case 'unsplash': return '📸';
      case 'pexels': return '🎬';
      case 'pixabay': return '🎨';
      default: return '🖼️';
    }
  };

  return (
    <div className="image-gallery">
      <div className="gallery-header">
        <h1>🐾 Galería de Imágenes PetLove</h1>
        <p>Explora miles de imágenes gratuitas de alta calidad para mascotas</p>
        
        {/* Formulario de búsqueda */}
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-container">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar imágenes... (ej: perros jugando, gatos durmiendo)"
              className="search-input"
            />
            <button type="submit" className="search-button" disabled={loading}>
              {loading ? 'Buscando...' : '🔍 Buscar'}
            </button>
          </div>
        </form>

        {/* Filtros */}
        <div className="filters">
          {/* Selector de categoría */}
          <div className="filter-group">
            <label>Categoría:</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="filter-select"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de servicio */}
          <div className="filter-group">
            <label>Fuente:</label>
            <select 
              value={selectedService} 
              onChange={(e) => handleServiceChange(e.target.value)}
              className="filter-select"
            >
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de tipo de contenido */}
          <div className="filter-group">
            <label>Tipo de contenido:</label>
            <select 
              value={contentType} 
              onChange={(e) => handleContentTypeChange(e.target.value)}
              className="filter-select"
            >
              {contentTypes.map(type => (
                <option 
                  key={type.id} 
                  value={type.id}
                  disabled={!isContentTypeAvailable(type.id)}
                >
                  {type.name} {!isContentTypeAvailable(type.id) ? '(No disponible)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Estado de servicios */}
          <div className="services-status">
            {Object.entries(servicesStatus).map(([service, configured]) => (
              <span 
                key={service} 
                className={`service-status ${configured ? 'configured' : 'not-configured'}`}
                title={`${service}: ${configured ? 'Configurado' : 'No configurado'}`}
              >
                {service === 'unsplash' && '📸'}
                {service === 'pexels' && '🎬'}
                {service === 'pixabay' && '🎨'}
                {configured ? '✅' : '❌'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Información de la categoría seleccionada */}
      <div className="category-info">
        <h3>{categories.find(cat => cat.id === selectedCategory)?.name}</h3>
        <p>{categories.find(cat => cat.id === selectedCategory)?.description}</p>
      </div>

      {/* Grid de imágenes */}
      <div className="images-grid">
        {images.map((image, index) => (
          <div key={`${image.source}-${image.id}-${index}`} className="image-card">
            <div className="image-container">
              <img
                src={image.url || image.urlMedium}
                alt={image.description || image.alt || 'Imagen de mascota'}
                loading="lazy"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x300?text=Error+al+cargar';
                }}
              />
              <div className="image-overlay">
                <div className="image-actions">
                  <button
                    onClick={() => handleDownload(image)}
                    className="action-btn download-btn"
                    title="Descargar imagen"
                  >
                    📥
                  </button>
                  <button
                    onClick={() => handleImageClick(image)}
                    className="action-btn view-btn"
                    title="Ver original"
                  >
                    👁️
                  </button>
                </div>
                <div className="service-badge">
                  {getServiceIcon(image.source)} {image.source}
                </div>
              </div>
            </div>
            <div className="image-info">
              <p className="image-description">
                {image.description || image.alt || 'Imagen de mascota'}
              </p>
              <p className="image-author">
                Foto por{' '}
                {getAuthorInfo(image).url ? (
                  <a
                    href={getAuthorInfo(image).url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {getAuthorInfo(image).name}
                  </a>
                ) : (
                  getAuthorInfo(image).name
                )}
                {' '}en {getAuthorInfo(image).platform}
              </p>
              {(image.likes || image.downloads || image.views) && (
                <div className="image-stats">
                  {image.likes && `❤️ ${image.likes}`}
                  {image.downloads && ` • 📥 ${image.downloads}`}
                  {image.views && ` • 👁️ ${image.views}`}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando imágenes...</p>
        </div>
      )}

      {/* Botón cargar más */}
      {images.length > 0 && hasMore && !loading && (
        <div className="load-more-container">
          <button onClick={handleLoadMore} className="load-more-btn">
            Cargar más imágenes
          </button>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="error-message">
          <h3>⚠️ Error</h3>
          <p>{error}</p>
          <button onClick={() => loadImages(true)} className="retry-btn">
            Reintentar
          </button>
        </div>
      )}

      {/* Sin resultados */}
      {images.length === 0 && !loading && !error && (
        <div className="no-results">
          <h3>🔍 No se encontraron imágenes</h3>
          <p>
            {searchTerm.trim() 
              ? 'Intenta con otros términos de búsqueda o cambia la categoría'
              : 'No hay imágenes disponibles para esta categoría y tipo de contenido'
            }
          </p>
          {!Object.values(servicesStatus).some(Boolean) && (
            <div className="config-warning">
              <p>⚠️ Ningún servicio de imágenes está configurado correctamente.</p>
              <p>Verifica las claves API en las variables de entorno.</p>
            </div>
          )}
        </div>
      )}

      {/* Atribución */}
      <div className="attribution">
        <p>
          Imágenes proporcionadas por{' '}
          <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">
            Unsplash
          </a>
          ,{' '}
          <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer">
            Pexels
          </a>
          {' '}y{' '}
          <a href="https://pixabay.com" target="_blank" rel="noopener noreferrer">
            Pixabay
          </a>
        </p>
      </div>
    </div>
  );
};

export default ImageGallery;
import React, { useState, useEffect } from 'react';
import { formatPriceCL } from '../../Utils/priceUtils';
import { FaFacebookF, FaInstagram, FaYoutube, FaTiktok } from 'react-icons/fa';
import './ImageCarousel.scss';

const ImageCarousel = ({ 
  autoPlay = true, 
  interval = 3000, 
  showDots = true, 
  showArrows = true,
  variant = 'default',
  showSocialButton = false,
  showCounter = false,
  showSocialLinks = false,
  showOverlayContent = true,
  images: imagesProp = [],
  onSlideClick
}) => {
  const getCategoriaIcon = (categoria = '', nombre = '') => {
    const c = String(categoria).toLowerCase();
    const n = String(nombre).toLowerCase();
    const isCat = c.includes('gato') || c.includes('felino') || n.includes('gato') || n.includes('felino') || n.includes('cat');
    if (c.includes('aliment')) return isCat ? '🐱🍖' : '🍖';
    if (c.includes('medic') || c.includes('salud')) return '💊';
    if (c.includes('higiene')) return '🧼';
    if (c.includes('juguet')) return '🎾';
    if (c.includes('vest') || c.includes('ropa')) return '🧥';
    if (c.includes('accesor')) return '🎀';
    if (c.includes('cuidado')) return '🧴';
    return '🐾';
  };
  const getCategoriaKey = (categoria = '') => {
    const c = String(categoria).toLowerCase();
    if (c.includes('aliment')) return 'alimentacion';
    if (c.includes('medic') || c.includes('salud')) return 'salud';
    if (c.includes('higiene')) return 'higiene';
    if (c.includes('juguet')) return 'juguetes';
    if (c.includes('vest') || c.includes('ropa')) return 'ropa';
    if (c.includes('accesor')) return 'accesorios';
    if (c.includes('cuidado')) return 'cuidado';
    return 'default';
  };
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Array.isArray(imagesProp) && imagesProp.length > 0) {
      setImages(imagesProp);
    } else {
      setImages([]);
    }
    setLoading(false);
  }, [imagesProp]);

  useEffect(() => {
    if (autoPlay && images.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
      }, interval);

      return () => clearInterval(timer);
    }
  }, [autoPlay, interval, images.length, currentIndex]);

  

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  };

  const handleImageError = () => {};

  if (loading) {
    return (
      <div className="carousel-container">
        <div className="carousel-loading">
          <div className="loading-spinner"></div>
          <p>Cargando imágenes...</p>
        </div>
      </div>
    );
  }

  

  return (
    <div className={`carousel-theme ${variant}`}>
      <div className="carousel-container">
        <div className="carousel-wrapper">
          <div className="carousel-track" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
          {images.map((image, index) => (
            <div 
              key={image.id ?? image.url ?? `image-${index}`} 
              className="carousel-slide"
              onClick={() => onSlideClick && onSlideClick(image, index)}
            >
              <img
                src={image.url}
                alt={image.title || `Slide ${index + 1}`}
                className="carousel-image"
                onError={() => handleImageError(index)}
                loading="lazy"
                decoding="async"
                sizes="(max-width: 600px) 100vw, (max-width: 1024px) 70vw, 50vw"
              />
              {showOverlayContent && (
                <div className="carousel-overlay">
                  <div className="carousel-content">
                    <h3>{image.title || `Imagen ${index + 1}`}</h3>
                    {typeof image.price !== 'undefined' && image.price !== null && (
                      <p className="producto-precio">{formatPriceCL(image.price)}</p>
                    )}
                    {image.author && <p>Por: {image.author}</p>}
                    {image.category && (
                      <span className={`categoria-badge ${getCategoriaKey(image.category)}`}>
                        {getCategoriaIcon(image.category, image.title)} {image.category}
                      </span>
                    )}
                    {!image.category && image.source && (
                      <span className="image-source">{image.source}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {showArrows && images.length > 1 && (
          <>
            <button 
              className="carousel-arrow carousel-arrow-left" 
              onClick={goToPrevious}
              aria-label="Imagen anterior"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button 
              className="carousel-arrow carousel-arrow-right" 
              onClick={goToNext}
              aria-label="Siguiente imagen"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
        </div>

        {showDots && images.length > 1 && (
          <div className="carousel-dots">
            {images.map((img, index) => (
              <button
                key={img.id ?? `dot-${index}`}
                className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Ir a imagen ${index + 1}`}
              />
            ))}
          </div>
        )}

        {showCounter && (
          <div className="carousel-controls">
            <span className="image-counter">
              {currentIndex + 1} / {images.length}
            </span>
          </div>
        )}

        {showSocialLinks && (
          <div className="social-links" aria-label="Redes sociales">
            <a href="" aria-label="Facebook" className="social-link"><FaFacebookF size={16} /></a>
            <a href="" aria-label="Instagram" className="social-link"><FaInstagram size={16} /></a>
            <a href="" aria-label="YouTube" className="social-link"><FaYoutube size={16} /></a>
            <a href="" aria-label="TikTok" className="social-link"><FaTiktok size={16} /></a>
          </div>
        )}
        {showSocialButton && (
          <button className="social-cta" title="Síguenos en nuestras redes">
            ¡Síguenos en nuestras redes!
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageCarousel;

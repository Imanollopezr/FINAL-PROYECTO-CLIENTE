import React, { useState, useEffect, useRef, useCallback } from 'react';
import OptimizedImage from './OptimizedImage';
import { formatPriceCL } from '../../Utils/priceUtils';
import './InteractiveCarousel.scss';

const InteractiveCarousel = ({ 
  items = [], 
  itemsPerSlide = 3, 
  autoplay = true, 
  autoplayDelay = 4000,
  showDots = true,
  showArrows = true,
  pauseOnHover = true,
  enableTouch = true,
  className = '',
  onQuickView,
  onViewDetails
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  
  const carouselRef = useRef(null);
  const intervalRef = useRef(null);
  const touchStartRef = useRef(0);

  const totalSlides = Math.ceil(items.length / itemsPerSlide);

  // Función para ir al siguiente slide
  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  }, [totalSlides]);

  // Función para ir al slide anterior
  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Función para ir a un slide específico
  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
  }, []);

  // Autoplay
  useEffect(() => {
    if (isPlaying && autoplay && totalSlides > 1) {
      intervalRef.current = setInterval(nextSlide, autoplayDelay);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, autoplay, autoplayDelay, nextSlide, totalSlides]);

  // Pausar/reanudar en hover
  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsPlaying(false);
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover && autoplay) {
      setIsPlaying(true);
    }
  };

  // Controles táctiles
  const handleTouchStart = (e) => {
    if (!enableTouch) return;
    
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setIsDragging(true);
    touchStartRef.current = touch.clientX;
    setIsPlaying(false);
  };

  const handleTouchMove = (e) => {
    if (!enableTouch || !isDragging) return;
    
    const touch = e.touches[0];
    const diff = touch.clientX - startX;
    setTranslateX(diff);
  };

  const handleTouchEnd = () => {
    if (!enableTouch || !isDragging) return;
    
    const threshold = 50;
    
    if (Math.abs(translateX) > threshold) {
      if (translateX > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
    
    setIsDragging(false);
    setTranslateX(0);
    
    if (autoplay && pauseOnHover) {
      setIsPlaying(true);
    }
  };

  // Controles de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Renderizar items del slide actual
  const renderSlideItems = () => {
    const startIndex = currentSlide * itemsPerSlide;
    const endIndex = Math.min(startIndex + itemsPerSlide, items.length);
    const slideItems = items.slice(startIndex, endIndex);

    return slideItems.map((item, index) => (
      <div key={`${currentSlide}-${index}`} className="carousel-item">
        <div className="producto-card">
          <div className="producto-imagen">
            <OptimizedImage
              src={item.imagen}
              alt={item.nombre}
              className="producto-img"
              lazy={true}
              quality="medium"
              aspectRatio="1/1"
            />
            <div className="producto-overlay">
              <button 
                className="btn-vista-rapida"
                onClick={() => onQuickView && onQuickView(item)}
                aria-label={`Vista rápida de ${item.nombre}`}
              >
                👁️ Vista Rápida
              </button>
            </div>
          </div>
          <div className="producto-info">
            <h3 className="producto-nombre">{item.nombre}</h3>
            <p className="producto-precio">{formatPriceCL(item.precio)}</p>
            <div className="producto-rating">
              {[...Array(5)].map((_, i) => (
                <span 
                  key={`star-${i}`}
                  className={`star ${i < (item.rating || 0) ? 'filled' : ''}`}
                >
                  ⭐
                </span>
              ))}
            </div>
            <button 
              className="btn-ver-detalles"
              onClick={() => onViewDetails && onViewDetails(item)}
            >
              Ver Detalles
            </button>
          </div>
        </div>
      </div>
    ));
  };

  if (items.length === 0) {
    return (
      <div className="carousel-empty">
        <p>No hay productos disponibles</p>
      </div>
    );
  }

  return (
    <div 
      className={`interactive-carousel ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={carouselRef}
    >
      {/* Controles de navegación */}
      {showArrows && totalSlides > 1 && (
        <>
          <button 
            className="carousel-arrow carousel-arrow-prev"
            onClick={prevSlide}
            aria-label="Slide anterior"
            disabled={isDragging}
          >
            ‹
          </button>
          <button 
            className="carousel-arrow carousel-arrow-next"
            onClick={nextSlide}
            aria-label="Siguiente slide"
            disabled={isDragging}
          >
            ›
          </button>
        </>
      )}

      {/* Contenedor del carrusel */}
      <div 
        className="carousel-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="carousel-track"
          style={{
            transform: `translateX(calc(-${currentSlide * 100}% + ${isDragging ? translateX : 0}px))`,
            transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}
        >
          {Array.from({ length: totalSlides }, (_, slideIndex) => (
            <div key={slideIndex} className="carousel-slide">
              <div className="productos-grid">
                {(() => {
                  const startIndex = slideIndex * itemsPerSlide;
                  const endIndex = Math.min(startIndex + itemsPerSlide, items.length);
                  return items.slice(startIndex, endIndex).map((item, itemIndex) => (
                    <div key={`${slideIndex}-${itemIndex}`} className="carousel-item">
                      <div className="producto-card">
                        <div className="producto-imagen">
                          <OptimizedImage
                            src={item.imagen}
                            alt={item.nombre}
                            className="producto-img"
                            lazy={true}
                            quality="medium"
                            aspectRatio="1/1"
                          />
                          <div className="producto-overlay">
                            <button 
                              className="btn-vista-rapida"
                              onClick={() => onQuickView && onQuickView(item)}
                              aria-label={`Vista rápida de ${item.nombre}`}
                            >
                              👁️ Vista Rápida
                            </button>
                          </div>
                        </div>
                        <div className="producto-info">
                          <h3 className="producto-nombre">{item.nombre}</h3>
                          <p className="producto-precio">{formatPriceCL(item.precio)}</p>
                          <div className="producto-rating">
                            {[...Array(5)].map((_, i) => (
                              <span 
                                key={`star-${i}`}
                                className={`star ${i < (item.rating || 0) ? 'filled' : ''}`}
                              >
                                ⭐
                              </span>
                            ))}
                          </div>
                          <button 
                            className="btn-ver-detalles"
                            onClick={() => item.onViewDetails && item.onViewDetails(item)}
                          >
                            Ver Detalles
                          </button>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicadores de puntos */}
      {showDots && totalSlides > 1 && (
        <div className="carousel-dots">
          {Array.from({ length: totalSlides }, (_, index) => (
            <button
              key={`dot-${index}`}
              className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Ir al slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Control de play/pause */}
      {autoplay && (
        <button 
          className="carousel-play-pause"
          onClick={() => setIsPlaying(prev => !prev)}
          aria-label={isPlaying ? 'Pausar carrusel' : 'Reproducir carrusel'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
      )}
    </div>
  );
};

export default InteractiveCarousel;
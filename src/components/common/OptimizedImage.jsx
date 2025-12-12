import React, { useState, useRef, useEffect } from 'react';
import './OptimizedImage.scss';

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  fallback = null,
  placeholder = null,
  lazy = true,
  aspectRatio = null,
  objectFit = 'cover',
  quality = 'high',
  sizes = null
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!lazy) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const getOptimizedSrc = (originalSrc, targetWidth = 800, targetHeight = 600) => {
    if (!originalSrc) return null;

    // Detectar si es una URL de Unsplash y optimizarla
    if (originalSrc.includes('images.unsplash.com')) {
      const params = new URLSearchParams();
      params.append('w', targetWidth);
      params.append('h', targetHeight);
      
      // Configurar calidad basada en la prop
      const qualityMap = {
        low: 60,
        medium: 80,
        high: 95
      };
      params.append('q', qualityMap[quality] || 80);
      params.append('fm', 'webp'); // Formato WebP para mejor compresión
      params.append('fit', 'crop');
      params.append('crop', 'smart');
      
      return `${originalSrc}?${params.toString()}`;
    }

    // Detectar si es una URL de Pexels y optimizarla
    if (originalSrc.includes('images.pexels.com')) {
      const params = new URLSearchParams();
      params.append('auto', 'compress');
      params.append('cs', 'tinysrgb');
      params.append('w', targetWidth);
      params.append('h', targetHeight);
      params.append('fit', 'crop');
      
      return originalSrc.includes('?') 
        ? `${originalSrc}&${params.toString()}`
        : `${originalSrc}?${params.toString()}`;
    }

    // Detectar si es una URL de Pixabay y usar el tamaño apropiado
    if (originalSrc.includes('pixabay.com')) {
      if (targetWidth <= 150) return originalSrc.replace('_640', '_150');
      if (targetWidth <= 340) return originalSrc.replace('_640', '_340');
      return originalSrc;
    }
    // Para otras URLs, devolver la original
    return originalSrc;
  };

  const getSrcSet = (originalSrc) => {
    if (!originalSrc || typeof originalSrc !== 'string') return '';
    
    // Para imágenes locales, generar diferentes densidades
    if (originalSrc.includes('assets')) {
      // Generar URLs para diferentes densidades de píxeles
      const baseUrl = originalSrc;
      return `${baseUrl} 1x, ${baseUrl} 2x, ${baseUrl} 3x`;
    }
    
    // Para URLs externas, intentar generar diferentes tamaños
    if (originalSrc.includes('unsplash.com')) {
      const url = new URL(originalSrc);
      const width = url.searchParams.get('w') || '400';
      const baseParams = url.search;
      
      return `${originalSrc} 1x, ${originalSrc.replace(`w=${width}`, `w=${parseInt(width) * 2}`)} 2x`;
    }
    
    return '';
  };

  const containerStyle = aspectRatio ? { aspectRatio } : {};
  const imageStyle = { objectFit };

  return (
    <div 
      ref={imgRef}
      className={`optimized-image-container ${className}`}
      style={containerStyle}
    >
      {!isInView && placeholder && (
        <div className="image-placeholder">
          {placeholder}
        </div>
      )}
      
      {isInView && !hasError && (
        <img
          src={getOptimizedSrc(src, 800, 600)}
          srcSet={getSrcSet(src)}
          sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
          alt={alt}
          className={`optimized-image ${isLoaded ? 'loaded' : 'loading'}`}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
        />
      )}
      
      {hasError && fallback && (
        <div className="image-fallback">
          {fallback}
        </div>
      )}
      
      {!isLoaded && isInView && !hasError && (
        <div className="image-loading">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
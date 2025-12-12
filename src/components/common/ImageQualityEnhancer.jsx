import React, { useState, useEffect, useRef } from 'react';
import OptimizedImage from './OptimizedImage';
import './HighQualityImage.scss';

const ImageQualityEnhancer = ({ 
  src, 
  alt, 
  className = '', 
  enhance = true,
  sharpness = 1.05,
  saturation = 1.1,
  brightness = 1.02,
  contrast = 1.05,
  ...props 
}) => {
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (imageLoaded && enhance) {
      // Aplicar mejoras después de que la imagen se cargue
      const timer = setTimeout(() => {
        setIsEnhanced(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [imageLoaded, enhance]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const getEnhancedStyle = () => {
    if (!enhance || !isEnhanced) return {};
    
    return {
      filter: `
        contrast(${contrast}) 
        saturate(${saturation}) 
        brightness(${brightness})
        ${sharpness > 1 ? `blur(${(2 - sharpness) * 0.5}px)` : ''}
      `.trim(),
      transition: 'filter 0.3s ease'
    };
  };

  const enhancedClassName = `
    ${className} 
    ${enhance ? 'enhanced-image' : ''} 
    ${isEnhanced ? 'quality-enhanced' : ''}
    ${imageLoaded ? 'image-ready' : 'image-loading'}
  `.trim();

  return (
    <div 
      ref={containerRef}
      className={`image-quality-enhancer high-quality-container ${enhancedClassName}`}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        className="high-quality-image enhanced"
        style={getEnhancedStyle()}
        onLoad={handleImageLoad}
        quality="high"
        {...props}
        fallback={
          <div className="quality-placeholder">
            <div className="placeholder-icon">🖼️</div>
            <div className="placeholder-text">Cargando imagen...</div>
          </div>
        }
        placeholder={
          <div className="quality-loading">
            <div className="loading-spinner"></div>
          </div>
        }
      />
      
      {/* Overlay de mejora de calidad */}
      {enhance && (
        <div className={`quality-overlay ${isEnhanced ? 'active' : ''}`}>
          <div className="quality-indicator">
            <span className="quality-badge">HD</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageQualityEnhancer;
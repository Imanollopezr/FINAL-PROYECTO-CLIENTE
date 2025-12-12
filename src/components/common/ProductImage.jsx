import React from 'react';
import OptimizedImage from './OptimizedImage';
import ImageQualityEnhancer from './ImageQualityEnhancer';
// Importar imágenes locales
import mascotasImage from '../../assets/images/mascotas.png';
import perroImage from '../../assets/images/perro.png';
import petincioImage from '../../assets/images/petincio.png';
import fondoImage from '../../assets/images/fondo.jpg';
import mascotasLoginImage from '../../assets/images/Mascotaslogin2.png';

const ProductImage = ({ categoria, nombre, className = '', size = 'medium' }) => {
  // Mapeo de categorías a imágenes locales
  const getProductImageUrl = (categoria, nombre) => {
    const categoryImages = {
      'Alimentación': [
        mascotasImage, // Imagen de mascotas para comida
        perroImage,    // Imagen de perro para comida de perros
        petincioImage  // Imagen de mascota para snacks
      ],
      'Juguetes': [
        perroImage,           // Imagen de perro para juguetes
        mascotasLoginImage,   // Imagen de mascotas para juguetes interactivos
        mascotasImage         // Imagen general de mascotas
      ],
      'Accesorios': [
        mascotasImage,        // Imagen de mascotas para camas
        perroImage,           // Imagen de perro para collares
        petincioImage         // Imagen de mascota para accesorios
      ],
      'Salud': [
        mascotasLoginImage,   // Imagen de mascotas para medicina
        perroImage,           // Imagen de perro para vitaminas
        mascotasImage         // Imagen general para salud
      ]
    };
    
    // Seleccionar imagen basada en el nombre del producto para consistencia
    const images = categoryImages[categoria] || categoryImages['Accesorios'];
    const index = nombre ? nombre.length % images.length : 0;
    return images[index];
  };

  const getPlaceholderIcon = (categoria) => {
    const icons = {
      'Alimentación': '🍖',
      'Juguetes': '🎾',
      'Accesorios': '🏠',
      'Salud': '💊'
    };
    return icons[categoria] || '🐾';
  };

  const getFallbackIcon = (categoria) => {
    const icons = {
      'Alimentación': '🥘',
      'Juguetes': '🧸',
      'Accesorios': '🎀',
      'Salud': '⚕️'
    };
    return icons[categoria] || '📦';
  };

  return (
    <div className={`product-image-container ${className} ${size}`}>
      <ImageQualityEnhancer
        src={getProductImageUrl(categoria, nombre)}
        alt={`${categoria} - ${nombre}`}
        className="product-image"
        lazy={true}
        aspectRatio="1/1"
        objectFit="cover"
        quality="high"
        sizes="(max-width: 480px) 150px, (max-width: 768px) 200px, 250px"
        enhanceQuality={true}
        sharpness={1.1}
        saturation={1.05}
        brightness={1.02}
        fallback={
          <div className="product-fallback">
            <span className="fallback-icon">📦</span>
            <span className="fallback-text">Producto</span>
          </div>
        }
        placeholder={
          <div className="product-placeholder">
            <span className="placeholder-icon">🐾</span>
          </div>
        }
      />
    </div>
  );
};

export default ProductImage;
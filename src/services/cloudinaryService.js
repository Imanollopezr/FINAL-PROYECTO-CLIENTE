/**
 * Servicio para obtener imágenes de alta calidad desde Cloudinary
 * Utiliza el account demo de Cloudinary con imágenes gratuitas
 */

// URLs base de Cloudinary con imágenes reales de productos para mascotas
const CLOUDINARY_BASE_URL = 'https://res.cloudinary.com/petco/image/upload';

// URLs específicas de productos reales para mascotas de diferentes fuentes
const PET_PRODUCT_IMAGES = [
  // Comida para perros
  'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop',
  
  // Juguetes para mascotas
  'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=400&h=300&fit=crop',
  
  // Camas y accesorios
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400&h=300&fit=crop',
  
  // Collares y correas
  'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop',
  
  // Productos de cuidado
  'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop'
];

// Imágenes hero específicas para mascotas
const HERO_PET_IMAGES = [
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=500&fit=crop'
];

// Mapeo de categorías a imágenes específicas
const CATEGORY_IMAGES = {
  'alimento': 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=300&fit=crop',
  'comida': 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop',
  'juguete': 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop',
  'juguetes': 'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=400&h=300&fit=crop',
  'cama': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop',
  'accesorio': 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400&h=300&fit=crop',
  'collar': 'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=400&h=300&fit=crop',
  'correa': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop',
  'cuidado': 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop',
  'higiene': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop'
};

/**
 * Obtiene una imagen aleatoria de productos para mascotas
 * @returns {string} URL de imagen de Cloudinary
 */
export const getRandomPetImage = () => {
  const randomIndex = Math.floor(Math.random() * PET_PRODUCT_IMAGES.length);
  return PET_PRODUCT_IMAGES[randomIndex];
};

/**
 * Obtiene una imagen hero aleatoria
 * @returns {string} URL de imagen hero de Cloudinary
 */
export const getRandomHeroImage = () => {
  const randomIndex = Math.floor(Math.random() * HERO_PET_IMAGES.length);
  return HERO_PET_IMAGES[randomIndex];
};

/**
 * Obtiene múltiples imágenes aleatorias sin repetir
 * @param {number} count - Número de imágenes a obtener
 * @returns {string[]} Array de URLs de imágenes
 */
export const getMultipleRandomImages = (count = 6) => {
  const unique = Array.from(new Set(PET_PRODUCT_IMAGES));
  const shuffled = [...unique].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, unique.length));
};

/**
 * Obtiene una imagen específica por categoría de producto
 * @param {string} categoria - Categoría del producto
 * @returns {string} URL de imagen apropiada para la categoría
 */
export const getImageByCategory = (categoria) => {
  const key = categoria?.toLowerCase() || 'default';
  return CATEGORY_IMAGES[key] || getRandomPetImage();
};

/**
 * Transforma una URL de Cloudinary con parámetros específicos
 * @param {string} baseUrl - URL base de la imagen
 * @param {Object} options - Opciones de transformación
 * @returns {string} URL transformada
 */
export const transformCloudinaryImage = (baseUrl, options = {}) => {
  const {
    width = 400,
    height = 300,
    crop = 'crop',
    quality = 'auto'
  } = options;
  
  // Si es una URL de Unsplash, aplicar parámetros de transformación
  if (baseUrl.includes('unsplash.com')) {
    const baseUrlWithoutParams = baseUrl.split('?')[0];
    return `${baseUrlWithoutParams}?w=${width}&h=${height}&fit=${crop}&q=${quality}`;
  }
  
  return baseUrl;
};

export default {
  getRandomPetImage,
  getRandomHeroImage,
  getMultipleRandomImages,
  getImageByCategory,
  transformCloudinaryImage
};

/**
 * Servicio unificado de imágenes para PetLove
 * Integra Unsplash, Pexels y Pixabay en una sola interfaz
 */

import unsplashService from './unsplashService';
import pexelsService from './pexelsService';
import pixabayService from './pixabayService';

class ImageService {
  constructor() {
    this.services = {
      unsplash: unsplashService,
      pexels: pexelsService,
      pixabay: pixabayService
    };

    // Configuración por defecto
    this.defaultConfig = {
      perPage: 20,
      imageType: 'photo', // para Pixabay
      orientation: 'landscape'
    };

    // Categorías disponibles en PetLove
    this.categories = [
      'general',
      'alimentacion',
      'juguetes',
      'accesorios',
      'higiene',
      'salud'
    ];
  }

  /**
   * Obtiene imágenes de todos los servicios combinados
   * @param {string} categoria - Categoría de PetLove
   * @param {Object} options - Opciones de configuración
   * @returns {Promise<Array>} Array de imágenes combinadas
   */
  async getAllImages(categoria = 'general', options = {}) {
    const config = { ...this.defaultConfig, ...options };
    const promises = [];

    // Dividir la cantidad entre servicios
    const perService = Math.ceil(config.perPage / 3);

    // Unsplash
    promises.push(
      this.services.unsplash.getImagesByCategory(categoria, perService, 1)
        .then(result => result.results?.map(img => ({ ...img, source: 'unsplash' })) || [])
        .catch(error => {
          console.warn('Unsplash service failed:', error);
          return [];
        })
    );

    // Pexels
    promises.push(
      this.services.pexels.getPhotosByCategory(categoria, perService, 1)
        .then(result => result.photos?.map(img => ({ ...img, source: 'pexels' })) || [])
        .catch(error => {
          console.warn('Pexels service failed:', error);
          return [];
        })
    );

    // Pixabay
    promises.push(
      this.services.pixabay.getImagesByCategory(categoria, config.imageType, perService, 1)
        .then(result => result.results?.map(img => ({ ...img, source: 'pixabay' })) || [])
        .catch(error => {
          console.warn('Pixabay service failed:', error);
          return [];
        })
    );

    try {
      const results = await Promise.all(promises);
      const allImages = results.flat();
      
      // Mezclar aleatoriamente
      return this.shuffleArray(allImages);
    } catch (error) {
      console.error('Error getting all images:', error);
      return [];
    }
  }

  /**
   * Busca imágenes en todos los servicios
   * @param {string} query - Término de búsqueda
   * @param {Object} options - Opciones de configuración
   * @returns {Promise<Array>} Array de imágenes encontradas
   */
  async searchAllServices(query, options = {}) {
    const config = { ...this.defaultConfig, ...options };
    const promises = [];
    const perService = Math.ceil(config.perPage / 3);

    // Unsplash
    promises.push(
      this.services.unsplash.searchImages(query, 1, perService)
        .then(result => result.results?.map(img => ({ ...img, source: 'unsplash' })) || [])
        .catch(error => {
          console.warn('Unsplash search failed:', error);
          return [];
        })
    );

    // Pexels
    promises.push(
      this.services.pexels.searchPhotos(query, 1, perService)
        .then(result => result.photos?.map(img => ({ ...img, source: 'pexels' })) || [])
        .catch(error => {
          console.warn('Pexels search failed:', error);
          return [];
        })
    );

    // Pixabay
    promises.push(
      this.services.pixabay.searchImages(query, config.imageType, 1, perService)
        .then(result => result.results?.map(img => ({ ...img, source: 'pixabay' })) || [])
        .catch(error => {
          console.warn('Pixabay search failed:', error);
          return [];
        })
    );

    try {
      const results = await Promise.all(promises);
      const allImages = results.flat();
      
      return this.shuffleArray(allImages);
    } catch (error) {
      console.error('Error searching all services:', error);
      return [];
    }
  }

  /**
   * Obtiene imágenes de un servicio específico
   * @param {string} service - Nombre del servicio ('unsplash', 'pexels', 'pixabay')
   * @param {string} categoria - Categoría de PetLove
   * @param {Object} options - Opciones de configuración
   * @returns {Promise<Array>} Array de imágenes del servicio
   */
  async getImagesFromService(service, categoria = 'general', options = {}) {
    const config = { ...this.defaultConfig, ...options };
    
    if (!this.services[service]) {
      throw new Error(`Service ${service} not found`);
    }

    try {
      let result;
      
      switch (service) {
        case 'unsplash':
          result = await this.services.unsplash.getImagesByCategory(categoria, config.perPage, 1);
          return result.results?.map(img => ({ ...img, source: 'unsplash' })) || [];
          
        case 'pexels':
          result = await this.services.pexels.getPhotosByCategory(categoria, config.perPage, 1);
          return result.photos?.map(img => ({ ...img, source: 'pexels' })) || [];
          
        case 'pixabay':
          result = await this.services.pixabay.getImagesByCategory(categoria, config.imageType, config.perPage, 1);
          return result.results?.map(img => ({ ...img, source: 'pixabay' })) || [];
          
        default:
          return [];
      }
    } catch (error) {
      console.error(`Error getting images from ${service}:`, error);
      return [];
    }
  }

  /**
   * Busca en un servicio específico
   * @param {string} service - Nombre del servicio
   * @param {string} query - Término de búsqueda
   * @param {Object} options - Opciones de configuración
   * @returns {Promise<Array>} Array de imágenes encontradas
   */
  async searchInService(service, query, options = {}) {
    const config = { ...this.defaultConfig, ...options };
    
    if (!this.services[service]) {
      throw new Error(`Service ${service} not found`);
    }

    try {
      let result;
      
      switch (service) {
        case 'unsplash':
          result = await this.services.unsplash.searchImages(query, 1, config.perPage);
          return result.results?.map(img => ({ ...img, source: 'unsplash' })) || [];
          
        case 'pexels':
          result = await this.services.pexels.searchPhotos(query, 1, config.perPage);
          return result.photos?.map(img => ({ ...img, source: 'pexels' })) || [];
          
        case 'pixabay':
          result = await this.services.pixabay.searchImages(query, config.imageType, 1, config.perPage);
          return result.results?.map(img => ({ ...img, source: 'pixabay' })) || [];
          
        default:
          return [];
      }
    } catch (error) {
      console.error(`Error searching in ${service}:`, error);
      return [];
    }
  }

  /**
   * Obtiene una imagen aleatoria de cualquier servicio
   * @param {string} categoria - Categoría de PetLove
   * @returns {Promise<Object>} Imagen aleatoria
   */
  async getRandomImage(categoria = 'general') {
    const services = Object.keys(this.services);
    const randomService = services[Math.floor(Math.random() * services.length)];
    
    try {
      switch (randomService) {
        case 'unsplash':
          return await this.services.unsplash.getRandomImageByCategory(categoria);
        case 'pexels':
          return await this.services.pexels.getRandomPhotoByCategory(categoria);
        case 'pixabay':
          return await this.services.pixabay.getRandomImageByCategory(categoria);
        default:
          return null;
      }
    } catch (error) {
      console.error('Error getting random image:', error);
      return null;
    }
  }

  /**
   * Obtiene videos (solo de Pexels)
   * @param {string} categoria - Categoría de PetLove
   * @param {Object} options - Opciones de configuración
   * @returns {Promise<Array>} Array de videos
   */
  async getVideos(categoria = 'general', options = {}) {
    const config = { ...this.defaultConfig, ...options };
    
    try {
      const result = await this.services.pexels.getVideosByCategory(categoria, config.perPage, 1);
      return result.videos?.map(video => ({ ...video, source: 'pexels' })) || [];
    } catch (error) {
      console.error('Error getting videos:', error);
      return [];
    }
  }

  /**
   * Obtiene íconos y vectores (solo de Pixabay)
   * @param {string} categoria - Categoría de PetLove
   * @param {Object} options - Opciones de configuración
   * @returns {Promise<Array>} Array de íconos/vectores
   */
  async getIcons(categoria = 'general', options = {}) {
    const config = { ...this.defaultConfig, ...options };
    
    try {
      const result = await this.services.pixabay.getIconsByCategory(categoria, config.perPage);
      return result.results?.map(icon => ({ ...icon, source: 'pixabay' })) || [];
    } catch (error) {
      console.error('Error getting icons:', error);
      return [];
    }
  }

  /**
   * Obtiene ilustraciones (solo de Pixabay)
   * @param {string} categoria - Categoría de PetLove
   * @param {Object} options - Opciones de configuración
   * @returns {Promise<Array>} Array de ilustraciones
   */
  async getIllustrations(categoria = 'general', options = {}) {
    const config = { ...this.defaultConfig, ...options };
    
    try {
      const result = await this.services.pixabay.getIllustrationsByCategory(categoria, config.perPage);
      return result.results?.map(illustration => ({ ...illustration, source: 'pixabay' })) || [];
    } catch (error) {
      console.error('Error getting illustrations:', error);
      return [];
    }
  }

  /**
   * Descarga una imagen
   * @param {Object} image - Objeto de imagen
   * @returns {Promise<void>}
   */
  async downloadImage(image) {
    try {
      const imageUrl = image.urlLarge || image.url;
      const filename = `petlove-${image.source}-${image.id}.jpg`;
      
      if (image.source === 'pexels' && this.services.pexels.downloadImage) {
        await this.services.pexels.downloadImage(imageUrl, filename);
      } else {
        // Método genérico
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading image:', error);
      throw error;
    }
  }

  /**
   * Verifica qué servicios están configurados
   * @returns {Object} Estado de configuración de cada servicio
   */
  getServicesStatus() {
    return {
      unsplash: this.services.unsplash.isConfigured ? this.services.unsplash.isConfigured() : false,
      pexels: this.services.pexels.isConfigured ? this.services.pexels.isConfigured() : false,
      pixabay: this.services.pixabay.isConfigured ? this.services.pixabay.isConfigured() : false
    };
  }

  /**
   * Obtiene las categorías disponibles
   * @returns {Array} Array de categorías
   */
  getAvailableCategories() {
    return this.categories;
  }

  /**
   * Obtiene los servicios disponibles
   * @returns {Array} Array de servicios
   */
  getAvailableServices() {
    return Object.keys(this.services);
  }

  /**
   * Mezcla un array aleatoriamente
   * @param {Array} array - Array a mezclar
   * @returns {Array} Array mezclado
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Normaliza los datos de imagen entre servicios
   * @param {Object} image - Imagen a normalizar
   * @returns {Object} Imagen normalizada
   */
  normalizeImageData(image) {
    const normalized = {
      id: image.id,
      url: image.url || image.urlMedium,
      urlLarge: image.urlLarge || image.url,
      urlSmall: image.urlSmall || image.url,
      description: image.description || image.alt || 'Imagen de mascota',
      source: image.source,
      categoria: image.categoria
    };

    // Datos específicos por servicio
    switch (image.source) {
      case 'unsplash':
        normalized.author = image.author;
        normalized.authorUrl = image.authorUrl;
        normalized.likes = image.likes;
        break;
        
      case 'pexels':
        normalized.author = image.photographer;
        normalized.authorUrl = image.photographerUrl;
        normalized.pexelsUrl = image.pexelsUrl;
        break;
        
      case 'pixabay':
        normalized.author = image.author;
        normalized.authorUrl = image.authorUrl;
        normalized.likes = image.likes;
        normalized.downloads = image.downloads;
        normalized.views = image.views;
        break;
    }

    return normalized;
  }

  /**
   * Obtiene estadísticas de uso de los servicios
   * @returns {Object} Estadísticas de uso
   */
  getUsageStats() {
    return {
      totalServices: Object.keys(this.services).length,
      configuredServices: Object.values(this.getServicesStatus()).filter(Boolean).length,
      availableCategories: this.categories.length,
      supportedFeatures: {
        photos: true,
        videos: true, // Solo Pexels
        icons: true,  // Solo Pixabay
        illustrations: true, // Solo Pixabay
        search: true,
        download: true
      }
    };
  }
}

// Exportar instancia singleton
const imageService = new ImageService();
export default imageService;
/**
 * Servicio especializado para Unsplash API con categorías específicas de PetLove
 * Proporciona imágenes de alta calidad para productos de mascotas
 */

class UnsplashService {
  constructor() {
    this.accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
    this.baseUrl = 'https://api.unsplash.com';
    
    // Términos de búsqueda específicos por categoría de PetLove
    this.categoryQueries = {
      // 🐾 General mascotas
      'general': ['pets', 'dogs', 'cats', 'animals', 'pet care', 'domestic animals'],
      
      // 🍖 Alimentación
      'alimentacion': ['dog food', 'pet food', 'cat food', 'pet nutrition', 'animal feeding', 'pet bowl'],
      
      // 🎾 Juguetes
      'juguetes': ['dog toy', 'pet toys', 'cat toy', 'pet play', 'animal toys', 'pet entertainment'],
      
      // 🎀 Accesorios
      'accesorios': ['dog collar', 'pet accessories', 'pet leash', 'pet harness', 'pet clothing', 'pet gear'],
      
      // 🧼 Higiene
      'higiene': ['pet grooming', 'dog bath', 'pet hygiene', 'animal care', 'pet cleaning', 'grooming tools'],

      // ❤️ Salud
      'salud': ['veterinary', 'vet', 'pet health', 'animal medicine', 'pet care', 'veterinarian'],

      // 🔧 Slugs específicos comunes en tienda
      'arena-para-gatos': ['cat litter', 'litter box', 'cleaning litter', 'arena para gatos'],
      'correas': ['dog leash', 'pet leash', 'walking dog'],
      'arnes': ['dog harness', 'pet harness'],
      'rascador': ['cat scratching post', 'cat tree', 'cat scratcher'],
      'transportadora': ['pet carrier', 'dog carrier', 'cat carrier', 'pet travel'],
      'cama-para-perros': ['dog bed', 'pet bed', 'sleeping dog'],
      'cama-para-gatos': ['cat bed', 'pet bed', 'sleeping cat'],
      'comedero': ['pet bowl', 'dog bowl', 'cat bowl', 'feeding pet'],
      'bebedero': ['water bowl', 'pet fountain', 'dog drinking', 'cat drinking'],
      'shampoo-perros': ['dog shampoo', 'dog bath', 'pet grooming'],
      'shampoo-gatos': ['cat grooming', 'pet grooming cat', 'cat bath'],
      'snacks-perros': ['dog treats', 'dog snack', 'chewing dog'],
      'snacks-gatos': ['cat treats', 'cat snack']
    };
  }

  /**
   * Obtiene una imagen aleatoria de una categoría específica
   * @param {string} categoria - Categoría de PetLove
   * @param {number} width - Ancho de la imagen
   * @param {number} height - Alto de la imagen
   * @returns {Promise<Object>} Objeto con datos de la imagen
   */
  async getRandomImageByCategory(categoria = 'general', width = 800, height = 600) {
    if (!this.accessKey || this.accessKey === 'tu-unsplash-access-key-aqui') {
      console.warn('Unsplash API key not configured');
      return this.getFallbackImage(categoria, width, height);
    }

    try {
      const queries = this.categoryQueries[categoria] || this.categoryQueries.general;
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      
      const response = await fetch(
        `${this.baseUrl}/photos/random?query=${encodeURIComponent(randomQuery)}&w=${width}&h=${height}&client_id=${this.accessKey}&orientation=landscape&content_filter=high`
      );

      if (!response.ok) {
        if (response.status === 403) {
          console.warn('Unsplash API rate limit exceeded');
          return this.getFallbackImage(categoria, width, height);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        id: data.id,
        url: data.urls.regular,
        urlSmall: data.urls.small,
        urlThumb: data.urls.thumb,
        description: data.alt_description || data.description || `Imagen de ${categoria}`,
        author: data.user.name,
        authorUrl: data.user.links.html,
        downloadUrl: data.links.download_location,
        categoria: categoria
      };
    } catch (error) {
      console.error('Error fetching Unsplash image:', error);
      return this.getFallbackImage(categoria, width, height);
    }
  }

  /**
   * Obtiene múltiples imágenes de una categoría
   * @param {string} categoria - Categoría de PetLove
   * @param {number} count - Número de imágenes a obtener
   * @param {number} width - Ancho de las imágenes
   * @param {number} height - Alto de las imágenes
   * @returns {Promise<Array>} Array de objetos con datos de imágenes
   */
  async getMultipleImagesByCategory(categoria = 'general', count = 6, width = 400, height = 300) {
    if (!this.accessKey || this.accessKey === 'tu-unsplash-access-key-aqui') {
      console.warn('Unsplash API key not configured');
      return this.getFallbackImages(categoria, count, width, height);
    }

    try {
      const queries = this.categoryQueries[categoria] || this.categoryQueries.general;
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      
      const response = await fetch(
        `${this.baseUrl}/search/photos?query=${encodeURIComponent(randomQuery)}&page=1&per_page=${count}&client_id=${this.accessKey}&orientation=landscape&content_filter=high`
      );

      if (!response.ok) {
        if (response.status === 403) {
          console.warn('Unsplash API rate limit exceeded');
          return this.getFallbackImages(categoria, count, width, height);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return data.results.map(photo => ({
        id: photo.id,
        url: photo.urls.regular,
        urlSmall: photo.urls.small,
        urlThumb: photo.urls.thumb,
        description: photo.alt_description || photo.description || `Imagen de ${categoria}`,
        author: photo.user.name,
        authorUrl: photo.user.links.html,
        downloadUrl: photo.links.download_location,
        categoria: categoria
      }));
    } catch (error) {
      console.error('Error fetching multiple Unsplash images:', error);
      return this.getFallbackImages(categoria, count, width, height);
    }
  }

  /**
   * Busca imágenes con un término específico
   * @param {string} query - Término de búsqueda
   * @param {number} page - Página de resultados
   * @param {number} perPage - Imágenes por página
   * @returns {Promise<Object>} Objeto con resultados de búsqueda
   */
  async searchImages(query, page = 1, perPage = 15) {
    if (!this.accessKey || this.accessKey === 'tu-unsplash-access-key-aqui') {
      console.warn('Unsplash API key not configured');
      return { results: [], total: 0, totalPages: 0 };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&client_id=${this.accessKey}&orientation=landscape&content_filter=high`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        results: data.results.map(photo => ({
          id: photo.id,
          url: photo.urls.regular,
          urlSmall: photo.urls.small,
          urlThumb: photo.urls.thumb,
          description: photo.alt_description || photo.description || query,
          author: photo.user.name,
          authorUrl: photo.user.links.html,
          downloadUrl: photo.links.download_location
        })),
        total: data.total,
        totalPages: data.total_pages
      };
    } catch (error) {
      console.error('Error searching Unsplash images:', error);
      return { results: [], total: 0, totalPages: 0 };
    }
  }

  /**
   * Compatibilidad: obtén imágenes por categoría en formato { results: [] }
   * Usado por imageService.getAllImages
   * @param {string} categoria
   * @param {number} perPage
   * @param {number} page
   * @returns {Promise<Object>} { results, total, totalPages, page }
   */
  async getImagesByCategory(categoria = 'general', perPage = 15, page = 1) {
    try {
      const results = await this.getMultipleImagesByCategory(categoria, perPage);
      return {
        results,
        total: results.length,
        totalPages: 1,
        page
      };
    } catch (error) {
      console.error('Error getting images by category from Unsplash:', error);
      return { results: [], total: 0, totalPages: 0, page };
    }
  }

  /**
   * Indica si el servicio está configurado con access key
   * @returns {boolean}
   */
  isConfigured() {
    return Boolean(this.accessKey && this.accessKey !== 'tu-unsplash-access-key-aqui');
  }

  /**
   * Obtiene imágenes de fallback cuando Unsplash no está disponible
   */
  getFallbackImage(categoria, width, height) {
    const fallbackImages = {
      general: `https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=${width}&h=${height}&fit=crop`,
      alimentacion: `https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=${width}&h=${height}&fit=crop`,
      juguetes: `https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=${width}&h=${height}&fit=crop`,
      accesorios: `https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=${width}&h=${height}&fit=crop`,
      higiene: `https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=${width}&h=${height}&fit=crop`,
      salud: `https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=${width}&h=${height}&fit=crop`
    };

    return {
      id: `fallback-${categoria}`,
      url: fallbackImages[categoria] || fallbackImages.general,
      urlSmall: fallbackImages[categoria] || fallbackImages.general,
      urlThumb: fallbackImages[categoria] || fallbackImages.general,
      description: `Imagen de ${categoria}`,
      author: 'Unsplash',
      authorUrl: 'https://unsplash.com',
      categoria: categoria,
      isFallback: true
    };
  }

  /**
   * Obtiene múltiples imágenes de fallback
   */
  getFallbackImages(categoria, count, width, height) {
    const images = [];
    for (let i = 0; i < count; i++) {
      const fallbackImage = this.getFallbackImage(categoria, width, height);
      fallbackImage.id = `fallback-${categoria}-${i}`;
      images.push(fallbackImage);
    }
    return images;
  }

  /**
   * Obtiene las categorías disponibles
   */
  getAvailableCategories() {
    return Object.keys(this.categoryQueries);
  }

  /**
   * Obtiene los términos de búsqueda para una categoría
   */
  getCategoryQueries(categoria) {
    const key = String(categoria || 'general').toLowerCase();
    if (this.categoryQueries[key]) return this.categoryQueries[key];

    // Generar consultas dinámicas para categorías nuevas
    return this.generateDynamicQueries(key);
  }
}

// Exportar instancia singleton
const unsplashService = new UnsplashService();
export default unsplashService;
/**
 * Métodos auxiliares fuera de la clase para mantener compatibilidad
 * (Vite/ESM permite añadir métodos al prototipo)
 */
UnsplashService.prototype.generateDynamicQueries = function(categoria) {
  const base = String(categoria || '').toLowerCase().replace(/_/g, ' ').trim();

  const synonyms = [];
  if (/\barena\b/.test(base)) synonyms.push('cat litter', 'litter box', 'arena para gatos');
  if (/\bsnack|premio|treat\b/.test(base)) synonyms.push('pet treats', 'dog treats', 'cat treats');
  if (/\bcorrea\b/.test(base)) synonyms.push('pet leash', 'dog leash');
  if (/\barnes\b/.test(base)) synonyms.push('pet harness', 'dog harness');
  if (/\bropa|prenda\b/.test(base)) synonyms.push('pet clothing', 'dog clothes');
  if (/\bbaño|aseo\b/.test(base)) synonyms.push('dog bath', 'pet grooming');

  const tokens = [
    base,
    `${base} mascotas`,
    `${base} pet`,
    `${base} dogs`,
    `${base} cats`,
    'pets',
    ...synonyms
  ].filter(Boolean);

  return Array.from(new Set(tokens)).slice(0, 10);
};

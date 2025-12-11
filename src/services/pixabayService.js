/**
 * Servicio para Pixabay API con categorías específicas de PetLove
 * Especializado en íconos, ilustraciones y fotos gratuitas de mascotas
 */

class PixabayService {
  constructor() {
    this.apiKey = import.meta.env.VITE_PIXABAY_API_KEY;
    this.baseUrl = 'https://pixabay.com/api/';
    
    // Términos de búsqueda específicos por categoría de PetLove
    this.categoryQueries = {
      // 🐾 General mascotas
      'general': ['pets', 'dogs', 'cats', 'animals', 'pet+care', 'domestic+animals', 'mascota'],
      
      // 🍖 Alimentación
      'alimentacion': ['dog+food', 'pet+food', 'cat+food', 'comida+perros', 'alimento+mascotas', 'pet+bowl'],
      
      // 🎾 Juguetes
      'juguetes': ['pet+toys', 'dog+toy', 'cat+toy', 'juguetes+mascotas', 'pet+play', 'animal+toys'],
      
      // 🎀 Accesorios
      'accesorios': ['dog+collar', 'pet+accessories', 'collares+perros', 'pet+leash', 'pet+harness', 'correa+perro'],
      
      // 🧼 Higiene
      'higiene': ['dog+bath', 'pet+grooming', 'baño+perro', 'pet+hygiene', 'grooming+tools', 'pet+cleaning'],

      // ❤️ Salud
      'salud': ['veterinary', 'vet', 'veterinario+perro', 'pet+health', 'animal+medicine', 'pet+care'],

      // 🔧 Slugs específicos comunes en tienda
      'arena-para-gatos': ['cat+litter', 'litter+box', 'arena+gatos'],
      'correas': ['dog+leash', 'pet+leash', 'walking+dog'],
      'arnes': ['dog+harness', 'pet+harness'],
      'rascador': ['cat+scratching+post', 'cat+tree', 'cat+scratcher'],
      'transportadora': ['pet+carrier', 'dog+carrier', 'cat+carrier', 'pet+travel'],
      'cama-para-perros': ['dog+bed', 'pet+bed', 'sleeping+dog'],
      'cama-para-gatos': ['cat+bed', 'pet+bed', 'sleeping+cat'],
      'comedero': ['pet+bowl', 'dog+bowl', 'cat+bowl', 'feeding+pet'],
      'bebedero': ['water+bowl', 'pet+fountain', 'dog+drinking', 'cat+drinking'],
      'shampoo-perros': ['dog+shampoo', 'dog+bath', 'pet+grooming'],
      'shampoo-gatos': ['cat+grooming', 'pet+grooming+cat', 'cat+bath'],
      'snacks-perros': ['dog+treats', 'dog+snack', 'chewing+dog'],
      'snacks-gatos': ['cat+treats', 'cat+snack']
    };
  }

  /**
   * Obtiene imágenes de una categoría específica
   * @param {string} categoria - Categoría de PetLove
   * @param {string} imageType - Tipo de imagen: 'all', 'photo', 'illustration', 'vector'
   * @param {number} perPage - Número de imágenes por página (3-200)
   * @param {number} page - Página de resultados
   * @returns {Promise<Object>} Objeto con resultados de búsqueda
   */
  async getImagesByCategory(categoria = 'general', imageType = 'all', perPage = 20, page = 1) {
    if (!this.apiKey || this.apiKey === 'tu-pixabay-api-key-aqui') {
      console.warn('Pixabay API key not configured');
      return this.getFallbackImages(categoria, perPage);
    }

    try {
      const queries = this.categoryQueries[categoria] || this.categoryQueries.general;
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      
      const params = new URLSearchParams({
        key: this.apiKey,
        q: randomQuery,
        image_type: imageType,
        orientation: 'horizontal',
        category: 'animals',
        min_width: 640,
        min_height: 480,
        per_page: perPage,
        page: page,
        safesearch: 'true',
        order: 'popular'
      });

      const response = await fetch(`${this.baseUrl}?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        results: data.hits.map(image => ({
          id: image.id,
          url: image.webformatURL,
          urlLarge: image.largeImageURL,
          urlSmall: image.previewURL,
          description: image.tags,
          author: image.user,
          authorUrl: `https://pixabay.com/users/${image.user}-${image.user_id}/`,
          downloads: image.downloads,
          likes: image.likes,
          views: image.views,
          categoria: categoria,
          type: image.type,
          width: image.imageWidth,
          height: image.imageHeight
        })),
        total: data.total,
        totalHits: data.totalHits
      };
    } catch (error) {
      console.error('Error fetching Pixabay images:', error);
      return this.getFallbackImages(categoria, perPage);
    }
  }

  /**
   * Obtiene íconos específicos para la interfaz de PetLove
   * @param {string} categoria - Categoría de PetLove
   * @param {number} perPage - Número de íconos
   * @returns {Promise<Object>} Objeto con íconos
   */
  async getIconsByCategory(categoria = 'general', perPage = 10) {
    return this.getImagesByCategory(categoria, 'vector', perPage);
  }

  /**
   * Obtiene ilustraciones para la interfaz de PetLove
   * @param {string} categoria - Categoría de PetLove
   * @param {number} perPage - Número de ilustraciones
   * @returns {Promise<Object>} Objeto con ilustraciones
   */
  async getIllustrationsByCategory(categoria = 'general', perPage = 10) {
    return this.getImagesByCategory(categoria, 'illustration', perPage);
  }

  /**
   * Obtiene fotos de alta calidad
   * @param {string} categoria - Categoría de PetLove
   * @param {number} perPage - Número de fotos
   * @returns {Promise<Object>} Objeto con fotos
   */
  async getPhotosByCategory(categoria = 'general', perPage = 15) {
    return this.getImagesByCategory(categoria, 'photo', perPage);
  }

  /**
   * Busca imágenes con un término específico
   * @param {string} query - Término de búsqueda
   * @param {string} imageType - Tipo de imagen
   * @param {number} page - Página de resultados
   * @param {number} perPage - Imágenes por página
   * @returns {Promise<Object>} Objeto con resultados de búsqueda
   */
  async searchImages(query, imageType = 'all', page = 1, perPage = 20) {
    if (!this.apiKey || this.apiKey === 'tu-pixabay-api-key-aqui') {
      console.warn('Pixabay API key not configured');
      return { results: [], total: 0, totalHits: 0 };
    }

    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        q: query,
        image_type: imageType,
        orientation: 'horizontal',
        category: 'animals',
        min_width: 640,
        min_height: 480,
        per_page: perPage,
        page: page,
        safesearch: 'true',
        order: 'popular'
      });

      const response = await fetch(`${this.baseUrl}?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        results: data.hits.map(image => ({
          id: image.id,
          url: image.webformatURL,
          urlLarge: image.largeImageURL,
          urlSmall: image.previewURL,
          description: image.tags,
          author: image.user,
          authorUrl: `https://pixabay.com/users/${image.user}-${image.user_id}/`,
          downloads: image.downloads,
          likes: image.likes,
          views: image.views,
          type: image.type,
          width: image.imageWidth,
          height: image.imageHeight
        })),
        total: data.total,
        totalHits: data.totalHits
      };
    } catch (error) {
      console.error('Error searching Pixabay images:', error);
      return { results: [], total: 0, totalHits: 0 };
    }
  }

  /**
   * Obtiene una imagen aleatoria de una categoría
   * @param {string} categoria - Categoría de PetLove
   * @param {string} imageType - Tipo de imagen
   * @returns {Promise<Object>} Objeto con datos de la imagen
   */
  async getRandomImageByCategory(categoria = 'general', imageType = 'photo') {
    const result = await this.getImagesByCategory(categoria, imageType, 20, 1);
    if (result.results && result.results.length > 0) {
      const randomIndex = Math.floor(Math.random() * result.results.length);
      return result.results[randomIndex];
    }
    return this.getFallbackImage(categoria);
  }

  /**
   * Obtiene imágenes de fallback cuando Pixabay no está disponible
   */
  getFallbackImages(categoria, count) {
    const fallbackUrls = {
      general: 'https://cdn.pixabay.com/photo/2016/12/13/05/15/puppy-1903313_640.jpg',
      alimentacion: 'https://cdn.pixabay.com/photo/2017/09/25/13/12/dog-2785074_640.jpg',
      juguetes: 'https://cdn.pixabay.com/photo/2016/05/09/10/42/weimaraner-1381186_640.jpg',
      accesorios: 'https://cdn.pixabay.com/photo/2016/01/05/17/51/maltese-1123016_640.jpg',
      higiene: 'https://cdn.pixabay.com/photo/2018/03/31/06/31/dog-3277416_640.jpg',
      salud: 'https://cdn.pixabay.com/photo/2017/10/10/21/47/veterinarian-2838432_640.jpg'
    };

    const baseUrl = fallbackUrls[categoria] || fallbackUrls.general;
    const results = [];
    
    for (let i = 0; i < count; i++) {
      results.push({
        id: `pixabay-fallback-${categoria}-${i}`,
        url: baseUrl,
        urlLarge: baseUrl,
        urlSmall: baseUrl,
        description: `Imagen de ${categoria}`,
        author: 'Pixabay',
        authorUrl: 'https://pixabay.com',
        categoria: categoria,
        isFallback: true
      });
    }

    return { results, total: count, totalHits: count };
  }

  /**
   * Obtiene una imagen de fallback individual
   */
  getFallbackImage(categoria) {
    const fallback = this.getFallbackImages(categoria, 1);
    return fallback.results[0];
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

    // Generar consultas dinámicas para categorías nuevas (formato con '+')
    return this.generateDynamicQueries(key);
  }

  /**
   * Obtiene estadísticas de una imagen (para mostrar popularidad)
   */
  getImageStats(image) {
    return {
      downloads: image.downloads || 0,
      likes: image.likes || 0,
      views: image.views || 0,
      popularity: ((image.likes || 0) + (image.downloads || 0)) / 2
    };
  }
}

// Exportar instancia singleton
const pixabayService = new PixabayService();
export default pixabayService;
/**
 * Añadir generador dinámico al prototipo
 */
PixabayService.prototype.generateDynamicQueries = function(categoria) {
  const base = String(categoria || '').toLowerCase().replace(/_/g, ' ').trim();
  const plus = (s) => s.replace(/\s+/g, '+');

  const synonyms = [];
  if (/\barena\b/.test(base)) synonyms.push('cat litter', 'litter box', 'arena para gatos');
  if (/\bsnack|premio|treat\b/.test(base)) synonyms.push('pet treats', 'dog treats', 'cat treats');
  if (/\bcorrea\b/.test(base)) synonyms.push('pet leash', 'dog leash');
  if (/\barnes\b/.test(base)) synonyms.push('pet harness', 'dog harness');
  if (/\bropa|prenda\b/.test(base)) synonyms.push('pet clothing', 'dog clothes');
  if (/\bbaño|aseo\b/.test(base)) synonyms.push('dog bath', 'pet grooming');

  const rawTokens = [
    base,
    `${base} mascotas`,
    `${base} pet`,
    `${base} dogs`,
    `${base} cats`,
    'pets',
    ...synonyms
  ].filter(Boolean);

  const tokens = Array.from(new Set(rawTokens)).slice(0, 10).map(plus);
  return tokens;
};

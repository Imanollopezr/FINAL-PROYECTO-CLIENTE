/**
 * Servicio mejorado para Pexels API con categorías específicas de PetLove
 * Especializado en fotos y videos de mascotas de alta calidad
 */

class PexelsService {
  constructor() {
    this.apiKey = import.meta.env.VITE_PEXELS_API_KEY || 'YOUR_PEXELS_API_KEY_HERE';
    this.baseUrl = 'https://api.pexels.com/v1';
    this.videoUrl = 'https://api.pexels.com/videos';
    
    // Términos de búsqueda específicos por categoría de PetLove
    this.categoryQueries = {
      // 🐾 General mascotas
      'general': ['pets', 'dogs', 'cats', 'animals', 'pet care', 'domestic animals', 'mascotas', 'pet store', 'pet shop', 'tienda de mascotas', 'aisle pet store'],

      // 🍖 Alimentación
      'alimentacion': ['dog food', 'pet food', 'cat food', 'pet feeding', 'animal nutrition', 'pet bowl', 'pet store dog food aisle', 'pet store cat food aisle', 'tienda de mascotas alimento para perros', 'tienda de mascotas alimento para gatos'],

      // 🎾 Juguetes
      'juguetes': ['pet toys', 'dog toy', 'cat toy', 'pet play', 'animal toys', 'dog playing', 'pet store toy aisle', 'tienda de mascotas juguetes', 'pet shop toys'],

      // 🎀 Accesorios
      'accesorios': ['pet accessories', 'dog collar', 'pet leash', 'pet harness', 'pet clothing', 'dog accessories', 'pet store accessories', 'tienda de mascotas accesorios', 'pet shop collars'],

      // 🧼 Higiene
      'higiene': ['dog bath', 'pet grooming', 'pet hygiene', 'dog washing', 'pet cleaning', 'grooming salon', 'pet grooming store', 'tienda de mascotas aseo', 'salon de grooming mascotas'],

      // ❤️ Salud
      'salud': ['vet', 'veterinary', 'pet health', 'animal medicine', 'pet checkup', 'veterinarian', 'veterinary clinic', 'tienda de veterinaria', 'pet pharmacy'],

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
      'snacks-perros': ['dog treats', 'dog snack', 'chewing dog', 'pet store dog treats'],
      'snacks-gatos': ['cat treats', 'cat snack', 'pet store cat treats'],
      // Ajuste fino para relevancia en videos de alimentación
      'alimento-para-gatos': [
        'cat food aisle',
        'pet store cat food',
        'cat eating food',
        'kitten eating food',
        'pet shop cats food',
        'cat bowl feeding'
      ],
      'alimento-para-perros': [
        'dog food aisle',
        'pet store dog food',
        'dog eating food',
        'puppy eating food',
        'pet shop dogs food',
        'dog bowl feeding'
      ],
      'juguetes-para-perros': ['dog toy', 'pet store dog toys', 'juguetes perros tienda'],
      'juguetes-para-gatos': ['cat toy', 'pet store cat toys', 'juguetes gatos tienda'],
      'accesorios-para-perros': ['dog accessories', 'pet store dog accessories', 'accesorios perros tienda'],
      'accesorios-para-gatos': ['cat accessories', 'pet store cat accessories', 'accesorios gatos tienda'],
      'higiene-para-perros': ['dog grooming', 'pet store grooming', 'higiene perros tienda'],
      'higiene-para-gatos': ['cat grooming', 'pet store grooming cat', 'higiene gatos tienda']
    };

    // Headers para las peticiones
    this.headers = {
      'Authorization': this.apiKey
    };
  }

  /**
   * Obtiene fotos de una categoría específica
   * @param {string} categoria - Categoría de PetLove
   * @param {number} perPage - Número de fotos por página (1-80)
   * @param {number} page - Página de resultados
   * @param {string} size - Tamaño de imagen: 'large', 'medium', 'small'
   * @returns {Promise<Object>} Objeto con resultados de búsqueda
   */
  async getPhotosByCategory(categoria = 'general', perPage = 20, page = 1, size = 'medium') {
    if (!this.apiKey || this.apiKey === 'YOUR_PEXELS_API_KEY_HERE') {
      console.warn('Pexels API key not configured');
      return this.getFallbackPhotos(categoria, perPage);
    }

    try {
      const queries = this.getCategoryQueries(categoria);
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      
      const params = new URLSearchParams({
        query: randomQuery,
        per_page: Math.min(perPage, 80),
        page: page,
        orientation: 'landscape'
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('Pexels API rate limit exceeded');
          return this.getFallbackPhotos(categoria, perPage);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        photos: data.photos.map(photo => ({
          id: photo.id,
          url: photo.src[size] || photo.src.medium,
          urlLarge: photo.src.large,
          urlMedium: photo.src.medium,
          urlSmall: photo.src.small,
          urlOriginal: photo.src.original,
          description: photo.alt || `Imagen de ${categoria}`,
          photographer: photo.photographer,
          photographerUrl: photo.photographer_url,
          pexelsUrl: photo.url,
          width: photo.width,
          height: photo.height,
          categoria: categoria,
          avgColor: photo.avg_color
        })),
        totalResults: data.total_results,
        page: data.page,
        perPage: data.per_page,
        nextPage: data.next_page
      };
    } catch (error) {
      console.error('Error fetching Pexels photos:', error);
      return this.getFallbackPhotos(categoria, perPage);
    }
  }

  /**
   * Obtiene videos de una categoría específica
   * @param {string} categoria - Categoría de PetLove
   * @param {number} perPage - Número de videos por página (1-80)
   * @param {number} page - Página de resultados
   * @returns {Promise<Object>} Objeto con resultados de videos
   */
  async getVideosByCategory(categoria = 'general', perPage = 10, page = 1) {
    if (!this.apiKey || this.apiKey === 'YOUR_PEXELS_API_KEY_HERE') {
      console.warn('Pexels API key not configured');
      return { videos: [], totalResults: 0 };
    }

    try {
      const queries = this.getCategoryQueries(categoria);
      // Selección determinista para mejorar relevancia: prioriza el primer término
      const prioritizedQuery = this.getPrioritizedQuery(categoria, queries);
      
      const params = new URLSearchParams({
        query: prioritizedQuery,
        per_page: Math.min(perPage, 80),
        page: page,
        orientation: 'landscape'
      });

      const response = await fetch(`${this.videoUrl}/search?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('Pexels API rate limit exceeded');
          return { videos: [], totalResults: 0 };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        videos: data.videos.map(video => ({
          id: video.id,
          width: video.width,
          height: video.height,
          duration: video.duration,
          image: video.image,
          videoFiles: video.video_files.map(file => ({
            id: file.id,
            quality: file.quality,
            fileType: file.file_type,
            width: file.width,
            height: file.height,
            link: file.link
          })),
          videoPictures: video.video_pictures.map(pic => ({
            id: pic.id,
            picture: pic.picture,
            nr: pic.nr
          })),
          user: {
            id: video.user.id,
            name: video.user.name,
            url: video.user.url
          },
          categoria: categoria
        })),
        totalResults: data.total_results,
        page: data.page,
        perPage: data.per_page,
        nextPage: data.next_page
      };
    } catch (error) {
      console.error('Error fetching Pexels videos:', error);
      return { videos: [], totalResults: 0 };
    }
  }

  /**
   * Busca fotos con un término específico
   * @param {string} query - Término de búsqueda
   * @param {number} page - Página de resultados
   * @param {number} perPage - Fotos por página
   * @param {string} orientation - Orientación: 'landscape', 'portrait', 'square'
   * @returns {Promise<Object>} Objeto con resultados de búsqueda
   */
  async searchPhotos(query, page = 1, perPage = 20, orientation = 'landscape') {
    if (!this.apiKey || this.apiKey === 'YOUR_PEXELS_API_KEY_HERE') {
      console.warn('Pexels API key not configured');
      return { photos: [], totalResults: 0 };
    }

    try {
      const params = new URLSearchParams({
        query: query,
        per_page: Math.min(perPage, 80),
        page: page,
        orientation: orientation
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('Pexels API rate limit exceeded');
          return { photos: [], totalResults: 0 };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        photos: data.photos.map(photo => ({
          id: photo.id,
          url: photo.src.medium,
          urlLarge: photo.src.large,
          urlMedium: photo.src.medium,
          urlSmall: photo.src.small,
          urlOriginal: photo.src.original,
          description: photo.alt || query,
          photographer: photo.photographer,
          photographerUrl: photo.photographer_url,
          pexelsUrl: photo.url,
          width: photo.width,
          height: photo.height,
          avgColor: photo.avg_color
        })),
        totalResults: data.total_results,
        page: data.page,
        perPage: data.per_page,
        nextPage: data.next_page
      };
    } catch (error) {
      console.error('Error searching Pexels photos:', error);
      return { photos: [], totalResults: 0 };
    }
  }

  /**
   * Obtiene fotos curadas (populares) de Pexels
   * @param {number} page - Página de resultados
   * @param {number} perPage - Fotos por página
   * @returns {Promise<Object>} Objeto con fotos curadas
   */
  async getCuratedPhotos(page = 1, perPage = 20) {
    if (!this.apiKey || this.apiKey === 'YOUR_PEXELS_API_KEY_HERE') {
      console.warn('Pexels API key not configured');
      return this.getFallbackPhotos('general', perPage);
    }

    try {
      const params = new URLSearchParams({
        per_page: Math.min(perPage, 80),
        page: page
      });

      const response = await fetch(`${this.baseUrl}/curated?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('Pexels API rate limit exceeded');
          return this.getFallbackPhotos('general', perPage);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        photos: data.photos.map(photo => ({
          id: photo.id,
          url: photo.src.medium,
          urlLarge: photo.src.large,
          urlMedium: photo.src.medium,
          urlSmall: photo.src.small,
          urlOriginal: photo.src.original,
          description: photo.alt || 'Foto curada de Pexels',
          photographer: photo.photographer,
          photographerUrl: photo.photographer_url,
          pexelsUrl: photo.url,
          width: photo.width,
          height: photo.height,
          avgColor: photo.avg_color,
          isCurated: true
        })),
        totalResults: data.total_results || data.photos.length,
        page: data.page,
        perPage: data.per_page,
        nextPage: data.next_page
      };
    } catch (error) {
      console.error('Error fetching curated photos:', error);
      return this.getFallbackPhotos('general', perPage);
    }
  }

  /**
   * Obtiene una foto aleatoria de una categoría
   * @param {string} categoria - Categoría de PetLove
   * @returns {Promise<Object>} Objeto con datos de la foto
   */
  async getRandomPhotoByCategory(categoria = 'general') {
    const result = await this.getPhotosByCategory(categoria, 20, 1);
    if (result.photos && result.photos.length > 0) {
      const randomIndex = Math.floor(Math.random() * result.photos.length);
      return result.photos[randomIndex];
    }
    return this.getFallbackPhoto(categoria);
  }

  /**
   * Obtiene fotos de fallback cuando Pexels no está disponible
   */
  getFallbackPhotos(categoria, count) {
    const fallbackUrls = {
      general: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=640',
      alimentacion: 'https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&w=640',
      juguetes: 'https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=640',
      accesorios: 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=640',
      higiene: 'https://images.pexels.com/photos/6235663/pexels-photo-6235663.jpeg?auto=compress&cs=tinysrgb&w=640',
      salud: 'https://images.pexels.com/photos/6235231/pexels-photo-6235231.jpeg?auto=compress&cs=tinysrgb&w=640'
    };

    const baseUrl = fallbackUrls[categoria] || fallbackUrls.general;
    const photos = [];
    
    for (let i = 0; i < count; i++) {
      photos.push({
        id: `pexels-fallback-${categoria}-${i}`,
        url: baseUrl,
        urlLarge: baseUrl,
        urlMedium: baseUrl,
        urlSmall: baseUrl,
        description: `Imagen de ${categoria}`,
        photographer: 'Pexels',
        photographerUrl: 'https://pexels.com',
        pexelsUrl: 'https://pexels.com',
        categoria: categoria,
        isFallback: true
      });
    }

    return { photos, totalResults: count };
  }

  /**
   * Obtiene una foto de fallback individual
   */
  getFallbackPhoto(categoria) {
    const fallback = this.getFallbackPhotos(categoria, 1);
    return fallback.photos[0];
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

  /**
   * Genera términos de búsqueda dinámicos cuando la categoría no está predefinida
   * Esto permite que nuevas categorías (ej: "arena", "ropa", "snacks")
   * tengan resultados sin necesidad de editar el código cada vez.
   */
  generateDynamicQueries(categoria) {
    const base = String(categoria || '').toLowerCase().replace(/_/g, ' ').trim();

    // Sinónimos comunes en español → inglés para mejorar resultados
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

    // Evitar duplicados y entradas vacías
    return Array.from(new Set(tokens)).slice(0, 10);
  }

  /**
   * Selección determinista del término de búsqueda para videos
   * Da prioridad a consultas más específicas por categoría
   */
  getPrioritizedQuery(categoria, queries = []) {
    const key = String(categoria || 'general').toLowerCase();
    const list = Array.isArray(queries) ? queries : [];

    // Para categorías específicas de tienda, usar el primer término, más preciso
    const deterministicCategories = new Set([
      'alimento-para-gatos',
      'alimento-para-perros',
      'juguetes-para-perros',
      'juguetes-para-gatos',
      'accesorios-para-perros',
      'accesorios-para-gatos',
      'higiene-para-perros',
      'higiene-para-gatos'
    ]);

    if (deterministicCategories.has(key)) {
      return list[0] || key;
    }

    // Para categorías generales, si hay palabras de tienda, preferirlas
    const storePreferred = list.find(q => /pet store|pet shop|aisle/i.test(q));
    if (storePreferred) return storePreferred;

    // Por defecto, el primer término
    return list[0] || 'pets';
  }

  /**
   * Descarga una imagen desde Pexels
   * @param {string} imageUrl - URL de la imagen
   * @param {string} filename - Nombre del archivo
   * @returns {Promise<void>}
   */
  async downloadImage(imageUrl, filename) {
    try {
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
    } catch (error) {
      console.error('Error downloading image:', error);
      throw error;
    }
  }

  /**
   * Verifica si la API key está configurada
   */
  isConfigured() {
    return this.apiKey && this.apiKey !== 'YOUR_PEXELS_API_KEY_HERE';
  }

  /**
   * Obtiene información sobre los límites de la API
   */
  getApiLimits() {
    return {
      maxPerPage: 80,
      maxPages: 1000,
      rateLimit: '200 requests per hour for free accounts'
    };
  }
}

// Exportar instancia singleton
const pexelsService = new PexelsService();
export default pexelsService;

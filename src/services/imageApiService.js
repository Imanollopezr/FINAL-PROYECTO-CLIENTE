// Servicio para APIs de imágenes externas
class ImageApiService {
  constructor() {
    // Configuración de Unsplash
    this.unsplashAccessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
    this.unsplashBaseUrl = 'https://api.unsplash.com';
    
    // APIs gratuitas que no requieren autenticación
    this.cache = { pets: [] };

    this.apis = {
      unsplash: {
        name: 'Unsplash',
        baseUrl: this.unsplashBaseUrl,
        getRandomImage: async (query = 'pets', width = 800, height = 600) => {
          if (!this.unsplashAccessKey || this.unsplashAccessKey === 'tu-unsplash-access-key-aqui') {
            console.warn('Unsplash API key not configured, using pet image fallback');
            const petImg = await this.apis.pets.getDogImage();
            if (petImg) return petImg;
            const catImg = await this.apis.pets.getCatImage();
            if (catImg) return catImg;
            return null;
          }
          
          try {
            const response = await fetch(
              `${this.unsplashBaseUrl}/photos/random?query=${query}&w=${width}&h=${height}&client_id=${this.unsplashAccessKey}&quality=70`
            );
            
            // Verificar si la respuesta es exitosa
            if (!response.ok) {
              if (response.status === 403) {
                console.warn('Unsplash API rate limit exceeded, using pet image fallback');
                const petImg = await this.apis.pets.getDogImage();
                if (petImg) return petImg;
                const catImg = await this.apis.pets.getCatImage();
                if (catImg) return catImg;
                return null;
              }
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Verificar si la respuesta es JSON válido
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              console.warn('Unsplash API returned non-JSON response, using pet image fallback');
              const petImg = await this.apis.pets.getDogImage();
              if (petImg) return petImg;
              const catImg = await this.apis.pets.getCatImage();
              if (catImg) return catImg;
              return null;
            }
            
            const data = await response.json();
            
            // Verificar si la respuesta tiene la estructura esperada
            if (!data.id || !data.urls) {
              console.warn('Unsplash API returned unexpected data structure, using fallback');
              return this.apis.picsum.getRandomImage(width, height);
            }
            
            return {
              id: data.id,
              url: data.urls.regular || data.urls.small,
              thumbnail: data.urls.small,
              title: data.alt_description || 'Imagen de Unsplash',
              author: data.user.name,
              source: 'unsplash'
            };
          } catch (error) {
            console.error('Error fetching Unsplash image:', error);
            const petImg = await this.apis.pets.getDogImage();
            if (petImg) return petImg;
            const catImg = await this.apis.pets.getCatImage();
            if (catImg) return catImg;
            return null;
          }
        },
        searchImages: async (query = 'pets', count = 10, width = 800, height = 600) => {
          if (!this.unsplashAccessKey || this.unsplashAccessKey === 'tu-unsplash-access-key-aqui') {
            console.warn('Unsplash API key not configured, using pet image fallback');
            return await this.apis.pets.getPetImages(count);
          }
          
          try {
            const response = await fetch(
              `${this.unsplashBaseUrl}/search/photos?query=${query}&per_page=${Math.min(count, 6)}&client_id=${this.unsplashAccessKey}&quality=70`
            );
            
            // Verificar si la respuesta es exitosa
            if (!response.ok) {
              if (response.status === 403) {
                console.warn('Unsplash API rate limit exceeded, using pet image fallback');
                return await this.apis.pets.getPetImages(count);
              }
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Verificar si la respuesta es JSON válido
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              console.warn('Unsplash API returned non-JSON response, using pet image fallback');
              return await this.apis.pets.getPetImages(count);
            }
            
            const data = await response.json();
            
            // Verificar si la respuesta tiene la estructura esperada
            if (!data.results || !Array.isArray(data.results)) {
              console.warn('Unsplash API returned unexpected data structure, using fallback');
              return await this.apis.picsum.getImageList(1, count);
            }
            
            return data.results.map(img => ({
              id: img.id,
              url: img.urls.regular || img.urls.small,
              thumbnail: img.urls.small,
              title: img.alt_description || 'Imagen de Unsplash',
              author: img.user.name,
              source: 'unsplash'
            }));
          } catch (error) {
            console.error('Error searching Unsplash images:', error);
            return await this.apis.pets.getPetImages(count);
          }
        }
      },
      
      picsum: {
        name: 'Lorem Picsum',
        baseUrl: 'https://picsum.photos',
        getRandomImage: (width = 800, height = 600) => `${this.apis.picsum.baseUrl}/${width}/${height}?random=${Date.now()}&quality=95`,
        getImageById: (id, width = 800, height = 600) => `${this.apis.picsum.baseUrl}/id/${id}/${width}/${height}?quality=95`,
        getImageList: async (page = 1, limit = 10) => {
          try {
            const response = await fetch(`${this.apis.picsum.baseUrl}/v2/list?page=${page}&limit=${limit}`);
            const data = await response.json();
            return data.map(img => ({
              id: img.id,
              url: `${this.apis.picsum.baseUrl}/id/${img.id}/800/600?quality=95`,
              thumbnail: `${this.apis.picsum.baseUrl}/id/${img.id}/400/300?quality=95`,
              author: img.author,
              source: 'picsum'
            }));
          } catch (error) {
            console.error('Error fetching Picsum images:', error);
            return [];
          }
        }
      },
      
      jsonplaceholder: {
        name: 'JSONPlaceholder Photos',
        baseUrl: 'https://jsonplaceholder.typicode.com/photos',
        getImageList: async (limit = 10) => {
          try {
            const response = await fetch(`${this.apis.jsonplaceholder.baseUrl}?_limit=${limit}`);
            const data = await response.json();
            return data.map(img => ({
              id: img.id,
              url: img.url,
              thumbnail: img.thumbnailUrl,
              title: img.title,
              source: 'jsonplaceholder'
            }));
          } catch (error) {
            console.error('Error fetching JSONPlaceholder images:', error);
            return [];
          }
        }
      },

      // API de imágenes de mascotas específicas
      pets: {
        name: 'Pet Images',
        categories: {
          dogs: 'https://dog.ceo/api/breeds/image/random',
          cats: 'https://api.thecatapi.com/v1/images/search',
        },
        getDogImage: async () => {
          try {
            const response = await fetch(this.apis.pets.categories.dogs);
            const data = await response.json();
            return {
              id: Date.now(),
              url: data.message,
              thumbnail: data.message,
              title: 'Imagen de perro',
              source: 'dog-api'
            };
          } catch (error) {
            console.error('Error fetching dog image:', error);
            return null;
          }
        },
        getCatImage: async () => {
          try {
            const response = await fetch(this.apis.pets.categories.cats);
            const data = await response.json();
            return {
              id: data[0].id,
              url: data[0].url,
              thumbnail: data[0].url,
              title: 'Imagen de gato',
              source: 'cat-api'
            };
          } catch (error) {
            console.error('Error fetching cat image:', error);
            return null;
          }
        },
        getPetImages: async (count = 5) => {
          try {
            const result = [];
            // usar cache si existe
            if (Array.isArray(this.cache.pets) && this.cache.pets.length > 0) {
              result.push(...this.cache.pets.slice(0, count));
            }
            // si falta completar, pedir pocas en paralelo
            const remaining = count - result.length;
            if (remaining > 0) {
              const tasks = Array.from({ length: remaining }, (_, i) => (
                i % 2 === 0 ? this.apis.pets.getDogImage() : this.apis.pets.getCatImage()
              ));
              const settled = await Promise.allSettled(tasks);
              const fetched = settled
                .filter(s => s.status === 'fulfilled' && s.value)
                .map(s => s.value);
              // actualizar cache (limitada a 20)
              this.cache.pets = [...fetched, ...this.cache.pets].slice(0, 20);
              result.push(...fetched);
            }
            return result.slice(0, count);
          } catch (error) {
            console.error('Error fetching pet images:', error);
            return [];
          }
        }
      }
    };
  }

  // Método principal para obtener imágenes de diferentes fuentes
  async getImages(source = 'unsplash', options = {}) {
    const { count = 10, category = null, width = 400, height = 300, query = 'pets' } = options;

    switch (source) {
      case 'unsplash':
        if (category) {
          return await this.apis.unsplash.searchImages(category, count, width, height);
        }
        return await this.apis.unsplash.searchImages(query, count, width, height);
        
      case 'picsum':
        return await this.apis.picsum.getImageList(1, count);
      
      case 'jsonplaceholder':
        return await this.apis.jsonplaceholder.getImageList(count);
      
      case 'pets':
        if (category === 'dogs') {
          const images = [];
          for (let i = 0; i < count; i++) {
            const image = await this.apis.pets.getDogImage();
            if (image) images.push(image);
          }
          return images;
        } else if (category === 'cats') {
          const images = [];
          for (let i = 0; i < count; i++) {
            const image = await this.apis.pets.getCatImage();
            if (image) images.push(image);
          }
          return images;
        } else {
          return await this.apis.pets.getPetImages(count);
        }
      
      default:
        return await this.apis.unsplash.searchImages(query, count, width, height);
    }
  }

  // Obtener una imagen aleatoria (prioriza Unsplash)
  async getRandomImage(width = 800, height = 600, query = 'pets') {
    try {
      const unsplashImage = await this.apis.unsplash.getRandomImage(query, width, height);
      if (unsplashImage && typeof unsplashImage === 'object' && unsplashImage.url) {
        return unsplashImage;
      }
      const pets = await this.apis.pets.getPetImages(1);
      if (pets && pets.length > 0) return pets[0];
      return null;
    } catch (error) {
      console.error('Error getting random image:', error);
      const pets = await this.apis.pets.getPetImages(1);
      if (pets && pets.length > 0) return pets[0];
      return null;
    }
  }

  // Obtener imágenes para carrusel (prioriza Unsplash)
  async getCarouselImages(count = 3) {
    try {
      const unsplashImages = await this.apis.unsplash.searchImages('dog OR cat OR pet', Math.ceil(count * 0.7));
      const petImages = await this.apis.pets.getPetImages(Math.floor(count * 0.3));
      const combined = [...(unsplashImages || []), ...(petImages || [])];
      let allImages = combined.slice(0, count);
      if (allImages.length < count) {
        const morePets = await this.apis.pets.getPetImages(count - allImages.length);
        allImages = [...allImages, ...(morePets || [])];
      }
      return allImages.slice(0, count);
    } catch (error) {
      console.error('Error fetching carousel images:', error);
      const pets = await this.apis.pets.getPetImages(count);
      return pets.slice(0, count);
    }
  }

  // Mapear categorías a rangos de imágenes específicos - SOLO términos de mascotas
  getCategorySearchTerms(categoria) {
    const categoryMap = {
      'Alimentos': ['dog food', 'cat food', 'pet nutrition', 'dog eating', 'cat eating', 'pet feeding', 'dog bowl', 'cat bowl'],
      'Juguetes': ['dog toy', 'cat toy', 'pet playing', 'dog with ball', 'cat with toy', 'puppy playing', 'kitten playing'],
      'Cuidado': ['pet grooming', 'dog bath', 'cat grooming', 'pet hygiene', 'dog being washed', 'pet care'],
      'Accesorios': ['dog collar', 'pet accessories', 'dog leash', 'pet carrier', 'dog wearing collar', 'pet travel'],
      'Salud': ['healthy dog', 'healthy cat', 'happy pet', 'pet health', 'strong dog', 'pet wellness'],
      'Hogar': ['pet bed', 'dog sleeping', 'cat sleeping', 'pet resting', 'dog on bed', 'cat on bed'],
      'Alimentación': ['dog food', 'cat food', 'pet nutrition', 'dog eating', 'cat eating', 'pet feeding', 'dog bowl', 'cat bowl'],
      'Higiene': ['pet grooming', 'dog bath', 'cat grooming', 'pet hygiene', 'dog being washed', 'pet care']
    };

    return categoryMap[categoria] || ['happy dog', 'cute cat', 'pet portrait', 'adorable pet', 'dog and cat', 'pet family'];
  }

  // Obtener imágenes específicas por categoría de producto
  async getProductImagesByCategory(categoria, count = 5) {
    const searchTerms = this.getCategorySearchTerms(categoria);
    const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    
    try {
      return await this.searchImages(randomTerm, count);
    } catch (error) {
      console.error('Error getting category images:', error);
      return await this.getImages('pets', { count });
    }
  }

  // Obtener imagen específica basada en el nombre del producto
  async getProductImageByName(productName, categoria = null) {
    try {
      // Crear términos de búsqueda específicos basados en el nombre del producto
      const productTerms = this.getProductSpecificTerms(productName, categoria);
      const searchTerm = productTerms[Math.floor(Math.random() * productTerms.length)];
      
      const results = await this.searchImages(searchTerm, 1);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error getting product image by name:', error);
      return null;
    }
  }

  // Generar términos de búsqueda específicos basados en el nombre del producto
  getProductSpecificTerms(productName, categoria = null) {
    const name = productName.toLowerCase();
    let terms = [];

    // Mapeo específico por nombre de producto - SOLO términos relacionados con mascotas
    if (name.includes('alimento') || name.includes('comida')) {
      terms = ['dog food', 'pet food bowl', 'cat food', 'pet nutrition', 'animal feeding', 'dog eating', 'cat eating'];
    } else if (name.includes('juguete')) {
      if (name.includes('gato')) {
        terms = ['cat toy', 'cat playing', 'cat with toy', 'kitten playing', 'cat feather toy', 'cat ball'];
      } else {
        terms = ['dog toy', 'puppy playing', 'dog with ball', 'pet toy', 'dog playing fetch', 'dog rope toy'];
      }
    } else if (name.includes('cama')) {
      terms = ['dog sleeping', 'cat sleeping', 'pet bed', 'dog on bed', 'cat on bed', 'pet resting'];
    } else if (name.includes('collar')) {
      terms = ['dog collar', 'pet collar', 'dog wearing collar', 'pet accessories', 'dog leash'];
    } else if (name.includes('shampoo') || name.includes('champú')) {
      terms = ['dog bath', 'pet grooming', 'dog being washed', 'pet hygiene', 'dog shower'];
    } else if (name.includes('vitamina')) {
      terms = ['healthy dog', 'healthy cat', 'pet health', 'happy pet', 'strong dog', 'healthy pet'];
    } else if (name.includes('transportadora') || name.includes('carrier')) {
      terms = ['pet carrier', 'dog in carrier', 'cat in carrier', 'pet travel', 'dog transport'];
    } else if (name.includes('snack') || name.includes('dental')) {
      terms = ['dog treats', 'dog chewing', 'pet snacks', 'dog with bone', 'dog dental care'];
    } else if (name.includes('rascador')) {
      terms = ['cat scratching', 'cat tree', 'cat scratching post', 'cat climbing', 'cat furniture'];
    } else if (name.includes('correa')) {
      terms = ['dog leash', 'dog walking', 'pet leash', 'dog on leash', 'walking dog'];
    } else {
      // Fallback basado en categoría - solo términos de mascotas
      const categoryTerms = this.getCategorySearchTerms(categoria);
      terms = categoryTerms.filter(term => 
        term.includes('dog') || term.includes('cat') || term.includes('pet') || 
        term.includes('puppy') || term.includes('kitten') || term.includes('animal')
      );
      
      // Si no hay términos de mascotas, usar términos genéricos de mascotas
      if (terms.length === 0) {
        terms = ['happy dog', 'cute cat', 'pet portrait', 'dog and cat', 'pet family'];
      }
    }

    return terms;
  }

  // Buscar imágenes por categoría (usa Unsplash principalmente)
  async searchImages(query, count = 10) {
    try {
      // Intentar búsqueda en Unsplash primero
      const unsplashResults = await this.apis.unsplash.searchImages(query, count);
      if (unsplashResults && unsplashResults.length > 0) {
        return unsplashResults;
      }
    } catch (error) {
      console.warn('Unsplash search failed, trying alternatives:', error);
    }
    
    // Fallback a APIs de mascotas si la búsqueda es relacionada
    const petKeywords = ['dog', 'cat', 'pet', 'animal', 'perro', 'gato', 'mascota'];
    
    if (petKeywords.some(keyword => query.toLowerCase().includes(keyword))) {
      return await this.getImages('pets', { count });
    }
    
    return await this.getImages('pets', { count });
  }

  // Obtener información de las APIs disponibles
  getAvailableApis() {
    return Object.keys(this.apis).map(key => ({
      key,
      name: this.apis[key].name,
      description: `API de ${this.apis[key].name}`
    }));
  }
}

// Exportar instancia singleton
const imageApiService = new ImageApiService();
export default imageApiService;

// Exportar también la clase para casos específicos
export { ImageApiService };
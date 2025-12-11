import { API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '../constants/apiConstants';

class CategoriasService {
    constructor() {
        // Base endpoints
        this.productosEndpoint = API_ENDPOINTS.PRODUCTOS.GET_ALL;
        this.categoriasEndpoint = API_ENDPOINTS.CATEGORIAS.GET_ALL;
    }

    // Headers sin token; backend con cookies HttpOnly
    getAuthHeaders(extra = {}) {
        return {
            ...DEFAULT_HEADERS,
            ...extra
        };
    }

    async obtenerCategorias() {
        try {
            // Intentar endpoint dedicado de categorías
            const response = await fetch(buildApiUrl(this.categoriasEndpoint), {
                headers: this.getAuthHeaders(),
                credentials: 'include'
            });
            if (response.ok) {
                return await response.json();
            }

            // Si el endpoint no existe o falla, usar fallback desde productos
            return await this.extraerCategoriasDeProductos();
        } catch (error) {
            console.error('Error al obtener categorías:', error);
            // Fallback a extracción desde productos
            return await this.extraerCategoriasDeProductos();
        }
    }

    async extraerCategoriasDeProductos() {
        try {
            const response = await fetch(buildApiUrl(this.productosEndpoint), {
                headers: this.getAuthHeaders(),
                credentials: 'include'
            });
            if (!response.ok) {
                return [];
            }
            
            const productos = await response.json();
            
            // Extraer categorías únicas de los productos
            const categoriasSet = new Set();
            productos.forEach(producto => {
                const categoria = producto.categoria || producto.Categoria;
                if (categoria && String(categoria).trim()) {
                    categoriasSet.add(String(categoria).trim());
                }
            });
            
            // Convertir a array de objetos con estructura de categoría
            const categorias = Array.from(categoriasSet).map((nombre, index) => ({
                id: index + 1,
                nombre,
                descripcion: `Categoría de ${nombre}`,
                activo: true,
                cantidadProductos: productos.filter(p => (p.categoria || p.Categoria) === nombre).length
            }));
            
            return categorias;
            } catch (error) {
            console.error('Error al extraer categorías de productos:', error);
            return [];
        }
    }

    async obtenerProductosPorCategoria(categoria) {
        try {
            // Usar endpoint dedicado si existe
            const endpoint = API_ENDPOINTS.PRODUCTOS.POR_CATEGORIA.replace(':categoria', encodeURIComponent(categoria));
            const response = await fetch(buildApiUrl(endpoint), {
                headers: this.getAuthHeaders(),
                credentials: 'include'
            });
            if (response.ok) {
                return await response.json();
            }
            // Fallback a filtrado local
            return await this.filtrarProductosPorCategoria(categoria);
        } catch (error) {
            console.error('Error al obtener productos por categoría:', error);
            return await this.filtrarProductosPorCategoria(categoria);
        }
    }

    async filtrarProductosPorCategoria(categoria) {
        try {
            const response = await fetch(buildApiUrl(this.productosEndpoint), {
                headers: this.getAuthHeaders(),
                credentials: 'include'
            });
            if (!response.ok) {
                return [];
            }
            
            const productos = await response.json();
            return productos.filter(producto => {
                const cat = (producto.categoria || producto.Categoria || '').toLowerCase();
                return cat === categoria.toLowerCase();
            });
        } catch (error) {
            console.error('Error al filtrar productos por categoría:', error);
            return [];
        }
    }

    async obtenerEstadisticasCategorias() {
        try {
            const categorias = await this.obtenerCategorias();
            const productos = await this.obtenerTodosLosProductos();
            
            const estadisticas = categorias.map(categoria => {
                const productosCategoria = productos.filter(p => 
                    p.categoria && p.categoria.toLowerCase() === categoria.nombre.toLowerCase()
                );
                
                const stockTotal = productosCategoria.reduce((sum, p) => sum + (p.stock || 0), 0);
                const valorTotal = productosCategoria.reduce((sum, p) => sum + ((p.precio || 0) * (p.stock || 0)), 0);
                
                return {
                    categoria: categoria.nombre,
                    cantidadProductos: productosCategoria.length,
                    stockTotal: stockTotal,
                    valorTotal: valorTotal,
                    productosActivos: productosCategoria.filter(p => p.activo).length,
                    productosInactivos: productosCategoria.filter(p => !p.activo).length
                };
            });
            
            return estadisticas;
        } catch (error) {
            console.error('Error al obtener estadísticas de categorías:', error);
            throw error;
        }
    }

    async obtenerTodosLosProductos() {
        try {
            const response = await fetch(buildApiUrl(this.productosEndpoint), {
                headers: this.getAuthHeaders()
            });
            if (!response.ok) {
                throw new Error(`Error al obtener productos: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener todos los productos:', error);
            throw error;
        }
    }

    async buscarEnCategoria(categoria, termino) {
        try {
            const productosCategoria = await this.obtenerProductosPorCategoria(categoria);
            
            return productosCategoria.filter(producto =>
                producto.nombre.toLowerCase().includes(termino.toLowerCase()) ||
                (producto.descripcion && producto.descripcion.toLowerCase().includes(termino.toLowerCase())) ||
                (producto.codigo && producto.codigo.toLowerCase().includes(termino.toLowerCase()))
            );
        } catch (error) {
            console.error('Error al buscar en categoría:', error);
            throw error;
        }
    }

    async obtenerCategoriasConStock() {
        try {
            const categorias = await this.obtenerCategorias();
            const productos = await this.obtenerTodosLosProductos();
            
            return categorias.filter(categoria => {
                const productosCategoria = productos.filter(p => 
                    p.categoria && 
                    p.categoria.toLowerCase() === categoria.nombre.toLowerCase() &&
                    p.stock > 0
                );
                return productosCategoria.length > 0;
            });
        } catch (error) {
            console.error('Error al obtener categorías con stock:', error);
            throw error;
        }
    }

    async obtenerTopCategorias(limite = 5) {
        try {
            const estadisticas = await this.obtenerEstadisticasCategorias();
            
            return estadisticas
                .sort((a, b) => b.valorTotal - a.valorTotal)
                .slice(0, limite);
        } catch (error) {
            console.error('Error al obtener top categorías:', error);
            throw error;
        }
    }

    // Método auxiliar para normalizar nombres de categorías
    normalizarCategoria(categoria) {
        return categoria.trim().toLowerCase()
            .replace(/[áàäâ]/g, 'a')
            .replace(/[éèëê]/g, 'e')
            .replace(/[íìïî]/g, 'i')
            .replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u')
            .replace(/ñ/g, 'n');
    }
}

// Exportar instancia por defecto como otros servicios
export default new CategoriasService();

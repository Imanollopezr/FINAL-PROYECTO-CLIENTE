import { API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '../constants/apiConstants';

class ProductosService {
  // Obtener todos los productos
  async obtenerProductos() {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.PRODUCTOS.GET_ALL), {
        headers: DEFAULT_HEADERS,
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener productos:', error);
      throw error;
    }
  }

  // Obtener un producto por ID
  async obtenerProductoPorId(id) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.PRODUCTOS.GET_BY_ID.replace(':id', id)), {
        headers: DEFAULT_HEADERS,
        credentials: 'include'
      });
      // Tratar 404 como producto no encontrado (retornar null, sin lanzar error)
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        const errorData = await response.json().catch(() => ({}));
        if (errorData && (errorData.Message || errorData.message)) {
          errorMessage = errorData.Message || errorData.message;
        }
        throw new Error(errorMessage);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener producto:', error);
      throw error;
    }
  }

  // Crear un nuevo producto
  async crearProducto(producto) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.PRODUCTOS.CREATE), {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        credentials: 'include',
        body: JSON.stringify(producto),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error ${response.status}: ${errorData}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al crear producto:', error);
      throw error;
    }
  }

  // Actualizar un producto existente
  async actualizarProducto(id, producto) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.PRODUCTOS.UPDATE.replace(':id', id)), {
        method: 'PUT',
        headers: DEFAULT_HEADERS,
        credentials: 'include',
        body: JSON.stringify(producto),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error ${response.status}: ${errorData}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      throw error;
    }
  }

  // Eliminar un producto
  async eliminarProducto(id) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.PRODUCTOS.DELETE.replace(':id', id)), {
        method: 'DELETE',
        headers: DEFAULT_HEADERS,
        credentials: 'include'
      });
      
      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // Si no se puede parsear el JSON, usar el mensaje por defecto
        }
        
        throw new Error(errorMessage);
      }
      
      return true;
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      throw error;
    }
  }

  // Obtener productos por categoría
  async obtenerProductosPorCategoria(categoria) {
    try {
      const endpoint = API_ENDPOINTS.PRODUCTOS.POR_CATEGORIA.replace(':categoria', encodeURIComponent(categoria));
      const response = await fetch(buildApiUrl(endpoint), {
        headers: DEFAULT_HEADERS,
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener productos por categoría:', error);
      throw error;
    }
  }

  // Buscar productos
  async buscarProductos(termino) {
    try {
      const endpoint = API_ENDPOINTS.PRODUCTOS.BUSCAR.replace(':termino', encodeURIComponent(termino));
      const response = await fetch(buildApiUrl(endpoint), {
        headers: DEFAULT_HEADERS,
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al buscar productos:', error);
      throw error;
    }
  }

  // MÉTODOS PARA MANEJAR PROVEEDORES DE PRODUCTOS

  // Obtener proveedores de un producto
  async obtenerProveedoresDeProducto(productoId) {
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.PRODUCTOS.GET_ALL}/${productoId}/proveedores`), {
        headers: DEFAULT_HEADERS,
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener proveedores del producto:', error);
      throw error;
    }
  }

  // Agregar proveedor a un producto
  async agregarProveedorAProducto(productoId, proveedorData) {
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.PRODUCTOS.GET_ALL}/${productoId}/proveedores`), {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        credentials: 'include',
        body: JSON.stringify(proveedorData),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error ${response.status}: ${errorData}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al agregar proveedor al producto:', error);
      throw error;
    }
  }

  // Actualizar proveedor de un producto
  async actualizarProveedorDeProducto(productoId, proveedorId, proveedorData) {
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.PRODUCTOS.GET_ALL}/${productoId}/proveedores/${proveedorId}`), {
        method: 'PUT',
        headers: DEFAULT_HEADERS,
        credentials: 'include',
        body: JSON.stringify(proveedorData),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error ${response.status}: ${errorData}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error al actualizar proveedor del producto:', error);
      throw error;
    }
  }

  // Eliminar proveedor de un producto
  async eliminarProveedorDeProducto(productoId, proveedorId) {
    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.PRODUCTOS.GET_ALL}/${productoId}/proveedores/${proveedorId}`), {
        method: 'DELETE',
        headers: DEFAULT_HEADERS,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error al eliminar proveedor del producto:', error);
      throw error;
    }
  }
}

// Exportar una instancia del servicio
export default new ProductosService();

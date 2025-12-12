import { API_BASE_URL, API_ENDPOINTS } from '../constants/apiConstants';

class ProveedoresService {
  // Obtener todos los proveedores
  async obtenerProveedores() {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROVEEDORES.GET_ALL}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      throw error;
    }
  }

  // Obtener un proveedor por ID
  async obtenerProveedorPorId(id) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROVEEDORES.GET_BY_ID.replace(':id', id)}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener proveedor:', error);
      throw error;
    }
  }

  // Crear un nuevo proveedor
  async crearProveedor(proveedor) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROVEEDORES.CREATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proveedor),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error ${response.status}: ${errorData}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      throw error;
    }
  }

  // Actualizar un proveedor existente
  async actualizarProveedor(id, proveedor) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROVEEDORES.UPDATE.replace(':id', id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proveedor),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error ${response.status}: ${errorData}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      throw error;
    }
  }

  // Eliminar un proveedor
  async eliminarProveedor(id) {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROVEEDORES.DELETE.replace(':id', id)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      throw error;
    }
  }

  // Cambiar estado de proveedor (activar/desactivar)
  async cambiarEstadoProveedor(id, activo) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/proveedores/${id}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activo })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al cambiar estado del proveedor:', error);
      throw error;
    }
  }

  // Buscar proveedores
  async buscarProveedores(termino) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/proveedores/buscar?termino=${encodeURIComponent(termino)}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al buscar proveedores:', error);
      throw error;
    }
  }

  // Obtener tipos de documento
  async obtenerTiposDocumento() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tipos-documento`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener tipos de documento:', error);
      // Retornar datos por defecto si no hay endpoint
      return [
        { id: 1, nombre: 'Cédula de Ciudadanía' },
        { id: 2, nombre: 'NIT' },
        { id: 3, nombre: 'Cédula de Extranjería' },
        { id: 4, nombre: 'Pasaporte' }
      ];
    }
  }
}

// Exportar una instancia del servicio
export default new ProveedoresService();
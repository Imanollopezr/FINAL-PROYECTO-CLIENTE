import { API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '../constants/apiConstants';

class MarcasService {
  // Obtener todas las marcas
  async obtenerMarcas() {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.MARCAS.GET_ALL + '?includeInactive=true'), {
        headers: DEFAULT_HEADERS,
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener marcas:', error);
      throw error;
    }
  }

  // Crear nueva marca
  async crearMarca(marca) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.MARCAS.CREATE), {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        credentials: 'include',
        body: JSON.stringify(marca)
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al crear marca:', error);
      throw error;
    }
  }

  // Actualizar marca
  async actualizarMarca(id, marca) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.MARCAS.UPDATE.replace(':id', id)), {
        method: 'PUT',
        headers: DEFAULT_HEADERS,
        credentials: 'include',
        body: JSON.stringify(marca)
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al actualizar marca:', error);
      throw error;
    }
  }

  // Cambiar estado de marca
  async cambiarEstadoMarca(id, activo) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.MARCAS.CAMBIAR_ESTADO.replace(':id', id)), {
        method: 'PATCH',
        headers: DEFAULT_HEADERS,
        credentials: 'include',
        body: JSON.stringify({ activo })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al cambiar estado de la marca:', error);
      throw error;
    }
  }

  // Eliminar marca
  async eliminarMarca(id) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.MARCAS.DELETE.replace(':id', id)), {
        method: 'DELETE',
        headers: DEFAULT_HEADERS,
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al eliminar marca:', error);
      throw error;
    }
  }
}

const marcasService = new MarcasService();
export default marcasService;
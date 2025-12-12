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

  // Buscar marcas por término
  async buscarMarcas(termino) {
    try {
      const endpoint = API_ENDPOINTS.MARCAS.BUSCAR.replace(':termino', encodeURIComponent(termino));
      const response = await fetch(buildApiUrl(endpoint), {
        headers: DEFAULT_HEADERS,
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al buscar marcas:', error);
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
      // Parsear el cuerpo para obtener mensajes claros del backend
      const raw = await response.text();
      let data = null;
      try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
      if (!response.ok) {
        const msg =
          (data && (data.message || data.mensaje)) ||
          (response.status === 400 ? 'La marca está asociada a un producto.' : `Error ${response.status}: ${response.statusText}`);
        const err = new Error(msg);
        err.status = response.status;
        err.body = data;
        throw err;
      }
      // OK
      return data ?? {};
    } catch (error) {
      console.error('Error al eliminar marca:', error);
      throw error;
    }
  }
}

const marcasService = new MarcasService();
export default marcasService;

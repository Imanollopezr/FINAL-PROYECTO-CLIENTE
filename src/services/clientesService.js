import { API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '../constants/apiConstants';
import { getToken as getStoreToken } from '../features/auth/tokenStore';

// Headers con autorización usando el token del store (no localStorage)
const getAuthHeaders = (extra = {}) => {
  const token = getStoreToken();
  const base = {
    ...DEFAULT_HEADERS,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  return { ...base, ...extra };
};

class ClientesService {
  // Buscar clientes por término (documento, nombre, etc.)
  async buscar(termino) {
    try {
      const endpoint = buildApiUrl(API_ENDPOINTS.CLIENTES.BUSCAR.replace(':termino', encodeURIComponent(termino)));
      const response = await fetch(endpoint, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al buscar clientes:', error);
      throw error;
    }
  }
  // Obtener todos los clientes
  async obtenerClientes() {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CLIENTES.GET_ALL + '?includeInactive=true'), {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      throw error;
    }
  }

  // Crear cliente
  async crearCliente(cliente) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CLIENTES.CREATE), {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(cliente)
      });
      if (!response.ok) {
        const errTxt = await response.text().catch(() => '');
        throw new Error(`Error ${response.status}: ${errTxt || response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al crear cliente:', error);
      throw error;
    }
  }

  // Actualizar cliente
  async actualizarCliente(id, cliente) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CLIENTES.UPDATE.replace(':id', id)), {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(cliente)
      });
      if (!response.ok) {
        const errTxt = await response.text().catch(() => '');
        throw new Error(`Error ${response.status}: ${errTxt || response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      throw error;
    }
  }

  // Actualizar datos de contacto del cliente (documento, teléfono, ciudad)
  async actualizarContacto(id, contacto) {
    try {
      const endpoint = buildApiUrl(API_ENDPOINTS.CLIENTES.CONTACTO.replace(':id', id));
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(contacto)
      });
      if (!response.ok) {
        const errTxt = await response.text().catch(() => '');
        throw new Error(errTxt || `Error ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al actualizar contacto del cliente:', error);
      throw error;
    }
  }

  // Cambiar estado de cliente
  async cambiarEstadoCliente(id, estado) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CLIENTES.UPDATE.replace(':id', id)), {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ activo: estado })
      });
      if (!response.ok) {
        const errTxt = await response.text().catch(() => '');
        throw new Error(`Error ${response.status}: ${errTxt || response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al cambiar estado del cliente:', error);
      throw error;
    }
  }

  // Eliminar cliente
  async eliminarCliente(id) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CLIENTES.DELETE.replace(':id', id)), {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (!response.ok) {
        const errTxt = await response.text().catch(() => '');
        throw new Error(`Error ${response.status}: ${errTxt || response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      throw error;
    }
  }

  async obtenerMiCliente() {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.CLIENTES.ME), {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!response.ok) {
      const errTxt = await response.text().catch(() => '');
      throw new Error(errTxt || `Error ${response.status}`);
    }
    return await response.json();
  }

  async actualizarMiCliente(datos) {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.CLIENTES.ME), {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(datos)
    });
    if (!response.ok) {
      const errTxt = await response.text().catch(() => '');
      throw new Error(errTxt || `Error ${response.status}`);
    }
    return await response.json();
  }

  async obtenerMisPedidos() {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.CLIENTES.ME_PEDIDOS), {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!response.ok) {
      const errTxt = await response.text().catch(() => '');
      throw new Error(errTxt || `Error ${response.status}`);
    }
    return await response.json();
  }
}

const clientesService = new ClientesService();
export default clientesService;

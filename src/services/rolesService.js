import { API_BASE_URL, API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '../constants/apiConstants';
import { getToken as getStoreToken } from '../features/auth/tokenStore';

class RolesService {
  // Fetch usando cookies HttpOnly; sin localStorage
  async authFetch(url, options = {}) {
    const token = getStoreToken();
    const headers = token
      ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}`, ...(options.headers || {}) }
      : { ...DEFAULT_HEADERS, ...(options.headers || {}) };
    let response = await fetch(url, { ...options, headers, credentials: 'include' });
    // Si la sesión expiró, intentar refrescar y reintentar una vez
    if (response && response.status === 401) {
      try {
        const refresh = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.REFRESH_TOKEN), {
          method: 'POST',
          headers: DEFAULT_HEADERS,
          credentials: 'include',
          body: JSON.stringify({})
        });
        if (refresh.ok) {
          const newToken = getStoreToken();
          const retryHeaders = newToken
            ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${newToken}`, ...(options.headers || {}) }
            : { ...DEFAULT_HEADERS, ...(options.headers || {}) };
          response = await fetch(url, { ...options, headers: retryHeaders, credentials: 'include' });
        }
      } catch {
        // sin acción; se devolverá el 401 original
      }
    }
    return response;
  }

  createHttpError(response, fallbackMessage) {
    const status = response?.status || 0;
    let message = fallbackMessage || `Error ${status}: ${response?.statusText || 'Solicitud fallida'}`;
    if (status === 401) {
      message = 'No autorizado (401). Inicia sesión o tu sesión expiró.';
    } else if (status === 403) {
      message = 'Acceso denegado (403). No tienes permisos suficientes.';
    }
    const error = new Error(message);
    error.status = status;
    return error;
  }

  // Obtener todos los roles
  async obtenerRoles() {
    try {
      const response = await this.authFetch(buildApiUrl(API_ENDPOINTS.ROLES.GET_ALL), {
        method: 'GET'
      });
      
      if (!response.ok) {
        // Intentar extraer mensaje detallado del backend
        let fallback = undefined;
        try {
          const data = await response.json();
          fallback = data?.message || data?.error || undefined;
        } catch {
          try {
            fallback = await response.text();
          } catch {}
        }
        throw this.createHttpError(response, fallback);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al obtener roles:', error);
      throw error;
    }
  }

  // Obtener todos los roles con sus permisos (array de nombres)
  async obtenerRolesConPermisos() {
    try {
      const response = await this.authFetch(buildApiUrl(API_ENDPOINTS.ROLES.GET_ALL_WITH_PERMISOS), {
        method: 'GET'
      });

      if (!response.ok) {
        let fallback = undefined;
        try {
          const data = await response.json();
          fallback = data?.message || data?.error || undefined;
        } catch {
          try {
            fallback = await response.text();
          } catch {}
        }
        throw this.createHttpError(response, fallback);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener roles con permisos:', error);
      throw error;
    }
  }

  // Obtener un rol por ID
  async obtenerRolPorId(id) {
    try {
      const response = await this.authFetch(buildApiUrl(API_ENDPOINTS.ROLES.GET_BY_ID.replace(':id', id)), {
        method: 'GET'
      });
      
      if (!response.ok) {
        let fallback = undefined;
        try {
          const data = await response.json();
          fallback = data?.message || data?.error || undefined;
        } catch {
          try {
            fallback = await response.text();
          } catch {}
        }
        throw this.createHttpError(response, fallback);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al obtener rol:', error);
      throw error;
    }
  }

  // Crear un nuevo rol
  async crearRol(rol) {
    try {
      const response = await this.authFetch(buildApiUrl(API_ENDPOINTS.ROLES.CREATE), {
        method: 'POST',
        body: JSON.stringify(rol)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err = this.createHttpError(response, errorData.message);
        throw err;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al crear rol:', error);
      throw error;
    }
  }

  // Actualizar un rol existente
  async actualizarRol(id, rol) {
    try {
      const response = await this.authFetch(buildApiUrl(API_ENDPOINTS.ROLES.UPDATE.replace(':id', id)), {
        method: 'PUT',
        body: JSON.stringify(rol)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err = this.createHttpError(response, errorData.message);
        throw err;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al actualizar rol:', error);
      throw error;
    }
  }

  // Eliminar un rol
  async eliminarRol(id) {
    try {
      const response = await this.authFetch(buildApiUrl(API_ENDPOINTS.ROLES.DELETE.replace(':id', id)), {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err = this.createHttpError(response, errorData.message);
        throw err;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al eliminar rol:', error);
      throw error;
    }
  }

  // Buscar roles
  async buscarRoles(termino) {
    try {
      const response = await this.authFetch(buildApiUrl(API_ENDPOINTS.ROLES.SEARCH.replace(':termino', termino)), {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw this.createHttpError(response);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al buscar roles:', error);
      throw error;
    }
  }

  // Cambiar estado de un rol (activar/desactivar)
  async cambiarEstadoRol(id, activo) {
    try {
      const rol = await this.obtenerRolPorId(id);
      const rolActualizado = {
        ...rol,
        activo: activo
      };
      
      return await this.actualizarRol(id, rolActualizado);
    } catch (error) {
      console.error('Error al cambiar estado del rol:', error);
      throw error;
    }
  }
}

// Exportar una instancia del servicio
export default new RolesService();

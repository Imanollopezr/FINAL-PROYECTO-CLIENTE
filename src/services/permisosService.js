import { API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '../constants/apiConstants';
import { getToken as getStoreToken } from '../features/auth/tokenStore';

class PermisosService {
  async authFetch(url, options = {}) {
    const token = getStoreToken();
    const headers = {
      ...DEFAULT_HEADERS,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };
    const response = await fetch(url, { ...options, headers, credentials: 'include' });
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
  // Obtener todos los permisos
  async obtenerPermisos() {
    try {
      const response = await this.authFetch(buildApiUrl(API_ENDPOINTS.PERMISOS.GET_ALL), {
        method: 'GET'
      });
      if (!response.ok) {
        throw this.createHttpError(response);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener permisos:', error);
      throw error;
    }
  }

  // Obtener permisos por rol
  async obtenerPermisosPorRol(rolId) {
    try {
      // Normalizar y validar rolId antes de llamar a la API
      const rolIdNum = parseInt(rolId, 10);
      if (!Number.isFinite(rolIdNum) || rolIdNum <= 0) {
        console.warn('PermisosService.obtenerPermisosPorRol: rolId inválido, se omite llamada:', rolId);
        return [];
      }
      const response = await this.authFetch(buildApiUrl(API_ENDPOINTS.PERMISOS.GET_BY_ROL.replace(':rolId', String(rolIdNum))), {
        method: 'GET'
      });
      if (!response.ok) {
        // Si el rol no existe, devolver [] silenciosamente para evitar romper el flujo
        if (response.status === 404) {
          console.warn(`PermisosService.obtenerPermisosPorRol: rol ${rolIdNum} no encontrado (404). Retornando [].`);
          return [];
        }
        throw this.createHttpError(response);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener permisos por rol:', error);
      throw error;
    }
  }

  // Asignar permiso a rol
  async asignarPermisoARol(rolId, permisoId) {
    try {
      const response = await this.authFetch(buildApiUrl(API_ENDPOINTS.PERMISOS.ASSIGN_TO_ROL), {
        method: 'POST',
        body: JSON.stringify({ RolId: rolId, PermisoId: permisoId })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.createHttpError(response, errorData.message);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al asignar permiso a rol:', error);
      throw error;
    }
  }

  // Remover permiso de rol
  async removerPermisoDeRol(rolId, permisoId) {
    try {
      const response = await this.authFetch(buildApiUrl(API_ENDPOINTS.PERMISOS.REMOVE_FROM_ROL), {
        method: 'POST',
        body: JSON.stringify({ RolId: rolId, PermisoId: permisoId })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.createHttpError(response, errorData.message);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al remover permiso de rol:', error);
      throw error;
    }
  }
}

export default new PermisosService();

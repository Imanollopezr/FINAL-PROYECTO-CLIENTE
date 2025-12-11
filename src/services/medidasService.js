import { API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '../constants/apiConstants';
import { getToken as getStoreToken } from '../features/auth/tokenStore';

const getAuthHeaders = (extra = {}) => {
  const token = getStoreToken();
  return {
    ...DEFAULT_HEADERS,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra
  };
};

const authFetchWithRefresh = async (endpoint, options = {}) => {
  const url = buildApiUrl(endpoint);
  const buildOptions = () => ({
    ...options,
    headers: getAuthHeaders(options.headers || {})
  });

  let response = await fetch(url, buildOptions());

  if (response.status === 401) {
    try {
      const currentToken = localStorage.getItem('authToken');
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const refreshResp = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.REFRESH_TOKEN), {
          method: 'POST',
          headers: DEFAULT_HEADERS,
          body: JSON.stringify({ Token: currentToken, RefreshToken: refreshToken })
        });
        const refreshData = await refreshResp.json().catch(() => ({}));
        if (refreshResp.ok && refreshData && refreshData.data && refreshData.data.token) {
          localStorage.setItem('authToken', refreshData.data.token);
          if (refreshData.data.refreshToken) {
            localStorage.setItem('refreshToken', refreshData.data.refreshToken);
          }
          response = await fetch(url, buildOptions());
        }
      }
    } catch {}
  }

  return response;
};

class MedidasService {
  // Obtener todas las medidas
  async obtenerMedidas(signal) {
    try {
      const response = await authFetchWithRefresh(API_ENDPOINTS.MEDIDAS.GET_ALL + '?includeInactive=true', {
        credentials: 'include',
        signal
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener medidas:', error);
      throw error;
    }
  }

  // Buscar medidas por término
  async buscarMedidas(termino) {
    try {
      const endpoint = API_ENDPOINTS.MEDIDAS.BUSCAR.replace(':termino', encodeURIComponent(termino));
      const response = await authFetchWithRefresh(endpoint, {
        credentials: 'include'
      });
      if (response.ok) {
        return await response.json();
      }
      const todas = await this.obtenerMedidas();
      const lower = String(termino || '').toLowerCase();
      return (todas || []).filter(m => 
        String(m?.nombre || '').toLowerCase().includes(lower) ||
        String(m?.abreviatura || '').toLowerCase().includes(lower) ||
        String(m?.descripcion || '').toLowerCase().includes(lower)
      );
    } catch (error) {
      try {
        const todas = await this.obtenerMedidas();
        const lower = String(termino || '').toLowerCase();
        return (todas || []).filter(m => 
          String(m?.nombre || '').toLowerCase().includes(lower) ||
          String(m?.abreviatura || '').toLowerCase().includes(lower) ||
          String(m?.descripcion || '').toLowerCase().includes(lower)
        );
      } catch (inner) {
        console.error('Error al buscar medidas:', inner || error);
        throw inner || error;
      }
    }
  }

  // Crear nueva medida
  async crearMedida(medida) {
    try {
      const response = await authFetchWithRefresh(API_ENDPOINTS.MEDIDAS.CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(medida)
      });
      if (!response.ok) {
        const errTxt = await response.text().catch(() => '');
        throw new Error(`Error ${response.status}: ${errTxt || response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al crear medida:', error);
      throw error;
    }
  }

  // Actualizar medida
  async actualizarMedida(id, medida) {
    try {
      const response = await authFetchWithRefresh(API_ENDPOINTS.MEDIDAS.UPDATE.replace(':id', id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(medida)
      });
      if (!response.ok) {
        const errTxt = await response.text().catch(() => '');
        throw new Error(`Error ${response.status}: ${errTxt || response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al actualizar medida:', error);
      throw error;
    }
  }

  // Cambiar estado de medida
  async cambiarEstadoMedida(id, activo) {
    try {
      const response = await authFetchWithRefresh(API_ENDPOINTS.MEDIDAS.CAMBIAR_ESTADO.replace(':id', id), {
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify({ activo })
      });

      if (!response.ok) {
        const errTxt = await response.text().catch(() => '');
        throw new Error(`Error ${response.status}: ${errTxt || response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al cambiar estado de la medida:', error);
      throw error;
    }
  }

  // Eliminar medida (desactivar)
  async eliminarMedida(id) {
    try {
      const response = await authFetchWithRefresh(API_ENDPOINTS.MEDIDAS.DELETE.replace(':id', id), {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const errTxt = await response.text().catch(() => '');
        throw new Error(`Error ${response.status}: ${errTxt || response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al eliminar medida:', error);
      throw error;
    }
  }
}

const medidasService = new MedidasService();
export default medidasService;

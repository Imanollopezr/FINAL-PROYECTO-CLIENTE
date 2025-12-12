import { API_ENDPOINTS, buildApiUrl } from '../constants/apiConstants';
import { getToken as getStoreToken } from '../features/auth/tokenStore';

// Construye headers de autorización usando el token del store
const getAuthHeaders = (extra = {}) => {
  const token = getStoreToken();
  const base = {};
  if (token) base['Authorization'] = `Bearer ${token}`;
  return { ...base, ...extra };
};

const avatarService = {
  async subirAvatar(file) {
    if (!file) throw new Error('Archivo de imagen requerido');
    const formData = new FormData();
    formData.append('archivo', file);

    const response = await fetch(buildApiUrl(API_ENDPOINTS.ARCHIVOS.SUBIR_AVATAR), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: formData
    });

    const rawText = await response.text();
    let data = {};
    try { data = rawText ? JSON.parse(rawText) : {}; } catch { data = {}; }

    if (!response.ok) {
      const message = (data && (data.mensaje || data.message)) || rawText || 'Error al subir el avatar';
      throw new Error(message);
    }

    return data; // { url, nombreArchivo, ... }
  },

  async eliminarAvatar(nombreArchivo) {
    if (!nombreArchivo) throw new Error('Nombre de archivo requerido');
    const url = buildApiUrl(API_ENDPOINTS.ARCHIVOS.ELIMINAR_AVATAR.replace(':nombreArchivo', nombreArchivo));
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders({ 'Accept': 'application/json' }),
      credentials: 'include'
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.mensaje || data.message || 'Error al eliminar avatar');
    }
    return data;
  },

  async infoAvatar(nombreArchivo) {
    if (!nombreArchivo) throw new Error('Nombre de archivo requerido');
    const url = buildApiUrl(API_ENDPOINTS.ARCHIVOS.INFO_AVATAR.replace(':nombreArchivo', nombreArchivo));
    const response = await fetch(url, {
      headers: getAuthHeaders({ 'Accept': 'application/json' }),
      credentials: 'include'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.mensaje || data.message || 'Error al obtener info de avatar');
    }
    return data;
  }
};

export default avatarService;

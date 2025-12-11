import { API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '../constants/apiConstants';

// Headers sin almacenamiento local; usar cookies HttpOnly en backend
const getAuthHeaders = () => ({
  ...DEFAULT_HEADERS
});

// Servicio de autenticación
export const authService = {
  // Login con credenciales
  loginWithCredentials: async (email, password) => {
    try {
      const payload = {
        Correo: (email || '').trim().toLowerCase(),
        Clave: password
      }
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.LOGIN), {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        credentials: 'include',
        body: JSON.stringify(payload)
      })
      // Leer texto crudo para manejar casos donde el backend no retorna JSON válido
      const rawText = await response.text()
      let data = {}
      try { data = rawText ? JSON.parse(rawText) : {} } catch { data = {} }

      // Si la respuesta no es OK, devolver mensaje claro
      if (!response.ok) {
        const mensaje = (data && (data.Mensaje || data.mensaje)) || rawText || 'No se pudo iniciar sesión'
        return {
          Exitoso: false,
          Mensaje: mensaje,
          Data: null
        }
      }

      // No almacenar tokens en localStorage; el backend debe emitir cookies HttpOnly

      return data
    } catch (error) {
      console.error('Error en la autenticación:', error)
      throw new Error('Error en la autenticación')
    }
  },

  // Sincronizar usuario OAuth con backend y recibir JWT
  async syncOAuthUser(oauthUser) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.OAUTH_SYNC), {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        credentials: 'include',
        body: JSON.stringify({
          Email: oauthUser.email,
          Name: oauthUser.name,
          Image: oauthUser.image,
          Provider: oauthUser.provider,
          ProviderId: oauthUser.providerId || oauthUser.id
        })
      });

      // Parseo robusto: leer texto y luego intentar JSON
      const rawText = await response.text();
      let data = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (parseError) {
        // Si no es JSON, dejamos data como objeto vacío
        data = {};
      }

      if (!response.ok || (data && data.exitoso === false) || (!data || Object.keys(data).length === 0)) {
        const message = (data && (data.mensaje || data.Mensaje)) || rawText || `Error en la sincronización OAuth (status ${response.status})`;
        throw new Error(message);
      }

      // No almacenar tokens; depender de cookies emitidas por el backend

      return data;
    } catch (error) {
      console.error('Error en syncOAuthUser:', error);
      throw error;
    }
  },

  // Solicitar recuperación de contraseña
  async forgotPassword(correo) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.FORGOT_PASSWORD), {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({
          Correo: correo
        })
      });
      const rawText = await response.text();
      let data = {};
      try { data = rawText ? JSON.parse(rawText) : {}; } catch { data = {}; }

      if (!response.ok) {
        const message = (data && (data.mensaje || data.Mensaje)) || rawText || 'Error al solicitar recuperación de contraseña';
        throw new Error(message);
      }

      return data;
    } catch (error) {
      console.error('Error en forgotPassword:', error);
      throw error;
    }
  },

  // Verificar código de recuperación
  async verifyResetCode(correo, codigo) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.VERIFY_CODE), {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({
          Correo: correo,
          Codigo: codigo
        })
      });
      const rawText = await response.text();
      let data = {};
      try { data = rawText ? JSON.parse(rawText) : {}; } catch { data = {}; }

      if (!response.ok) {
        const message = (data && (data.mensaje || data.Mensaje)) || rawText || 'Error al verificar el código';
        throw new Error(message);
      }

      return data;
    } catch (error) {
      console.error('Error en verifyResetCode:', error);
      throw error;
    }
  },

  // Restablecer contraseña
  async resetPassword(correo, codigo, nuevaClave) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.RESET_PASSWORD), {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({
          Correo: correo,
          Codigo: codigo,
          NuevaClave: nuevaClave,
          ConfirmarClave: nuevaClave
        })
      });
      const rawText = await response.text();
      let data = {};
      try { data = rawText ? JSON.parse(rawText) : {}; } catch { data = {}; }

      if (!response.ok) {
        const message = (data && (data.mensaje || data.Mensaje)) || rawText || 'Error al restablecer contraseña';
        throw new Error(message);
      }

      return data;
    } catch (error) {
      console.error('Error en resetPassword:', error);
      throw error;
    }
  },

  // Cambiar contraseña para usuario autenticado
  async changePassword(claveActual, nuevaClave, confirmarClave) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.CHANGE_PASSWORD), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ClaveActual: claveActual,
          NuevaClave: nuevaClave,
          ConfirmarClave: confirmarClave
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.mensaje || data.Mensaje || 'Error al cambiar contraseña');
      }

      return data;
    } catch (error) {
      console.error('Error en changePassword:', error);
      throw error;
    }
  },

  // Registro de usuario
  async registerUser(userData) {
    try {
      console.log('=== DEBUG AUTHSERVICE REGISTER ===');
      console.log('URL:', buildApiUrl(API_ENDPOINTS.AUTH.REGISTER));
      console.log('Headers:', DEFAULT_HEADERS);
      console.log('Datos enviados:', userData);
      
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.REGISTER), {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(userData)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error data:', errorData);
        throw new Error(errorData.mensaje || errorData.message || 'Error en el registro');
      }

      const data = await response.json();
      console.log('Success data:', data);
      return data;
    } catch (error) {
      console.error('Error en registerUser:', error);
      throw error;
    }
  },

  // Logout
  async logout() {
    try {
      // Llamar API para revocar refresh y borrar cookie HttpOnly
      const resp = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.LOGOUT), {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        credentials: 'include',
        body: JSON.stringify({})
      });

      // Limpieza local de estado independientemente de la respuesta
      // Sin almacenamiento local

      if (!resp.ok) {
        const raw = await resp.text().catch(() => '');
        return { success: false, message: raw || 'Fallo al cerrar sesión en el servidor' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    return false;
  },

  // Obtener token actual
  getToken() {
    return null;
  }
};

export default authService;
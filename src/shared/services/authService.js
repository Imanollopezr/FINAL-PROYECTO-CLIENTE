/**
 * Servicio para manejar la comunicación con la API backend
 * y sincronizar usuarios de Auth.js con el sistema existente
 */

import { API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '../../constants/apiConstants'

class AuthService {
  /**
   * Autentica un usuario con credenciales en la API backend
   */
  async loginWithCredentials(email, password) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.LOGIN), {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        credentials: 'include',
        body: JSON.stringify({ Correo: email, Clave: password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.mensaje || errorData.message || 'Error en la autenticación')
      }

      const responseData = await response.json()
      
      // El backend devuelve { exitoso, mensaje, data }
      if (!responseData.exitoso) {
        throw new Error(responseData.mensaje || 'Error en la autenticación')
      }

      const userData = responseData.data
      
      // No almacenar tokens en localStorage; backend debe emitir cookies HttpOnly

      return {
        id: userData.usuario?.id || userData.id,
        email: userData.usuario?.correo || userData.correo || email,
        name: userData.usuario?.nombres || userData.nombres || userData.name,
        apellidos: userData.usuario?.apellidos || userData.apellidos,
        role: userData.usuario?.nombreRol || userData.nombreRol || userData.role,
        token: userData.token,
        refreshToken: userData.refreshToken
      }
    } catch (error) {
      console.error('Error en loginWithCredentials:', error)
      throw error
    }
  }

  /**
   * Registra un usuario en la API backend
   */
  async registerUser(userData) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.REGISTER), {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error en el registro')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en registerUser:', error)
      throw error
    }
  }

  /**
   * Sincroniza un usuario de OAuth con la API backend
   * Crea el usuario si no existe, o lo actualiza si ya existe
   */
  async syncOAuthUser(oauthUser) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.OAUTH_SYNC), {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({
          email: oauthUser.email,
          name: oauthUser.name,
          image: oauthUser.image,
          provider: oauthUser.provider,
          providerId: oauthUser.id,
        }),
      })

      // Parseo robusto: leer texto crudo y luego intentar JSON
      const rawText = await response.text()
      let data = {}
      try {
        data = rawText ? JSON.parse(rawText) : {}
      } catch (parseError) {
        data = {}
      }

      if (!response.ok || (data && data.exitoso === false) || (!data || Object.keys(data).length === 0)) {
        const message = (data && (data.mensaje || data.Mensaje || data.message)) || rawText || `Error en la sincronización OAuth (status ${response.status})`
        throw new Error(message)
      }

      return data
    } catch (error) {
      console.error('Error en syncOAuthUser:', error)
      throw error
    }
  }

  /**
   * Obtiene los datos del usuario desde la API
   */
  async getUserProfile(userId) {
    try {
      const response = await fetch(buildApiUrl(`/users/${userId}`), {
        method: 'GET',
        headers: DEFAULT_HEADERS,
      })

      if (!response.ok) {
        throw new Error('Error al obtener el perfil del usuario')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en getUserProfile:', error)
      throw error
    }
  }

  /**
   * Actualiza los datos del usuario en la API
   */
  async updateUserProfile(userId, userData) {
    try {
      const response = await fetch(buildApiUrl(`/users/${userId}`), {
        method: 'PUT',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al actualizar el perfil')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en updateUserProfile:', error)
      throw error
    }
  }

  /**
   * Solicita un código de recuperación de contraseña
   */
  async requestPasswordReset(email) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.FORGOT_PASSWORD), {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({ Correo: (email || '').trim() }),
      })
      // Parseo robusto: leer el texto primero, luego intentar JSON
      const rawText = await response.text()
      let data = {}
      try {
        data = rawText ? JSON.parse(rawText) : {}
      } catch {
        data = {}
      }
      
      if (!response.ok) {
        const message = data.mensaje || data.Mensaje || rawText || 'Error al solicitar recuperación de contraseña'
        throw new Error(message)
      }

      return data
    } catch (error) {
      console.error('Error en requestPasswordReset:', error)
      throw error
    }
  }

  /**
   * Verifica un código de recuperación de contraseña
   */
  async verifyResetCode(email, code) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.VERIFY_CODE), {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({ 
          Correo: (email || '').trim(),
          Codigo: String(code || '').trim()
        }),
      })
      // Parseo robusto para evitar errores cuando la respuesta está vacía
      const rawText = await response.text()
      let data = {}
      try {
        data = rawText ? JSON.parse(rawText) : {}
      } catch {
        data = {}
      }

      if (!response.ok) {
        const message = data.mensaje || data.Mensaje || rawText || 'Código inválido o expirado'
        throw new Error(message)
      }

      return data
    } catch (error) {
      console.error('Error en verifyResetCode:', error)
      throw error
    }
  }

  /**
   * Restablece la contraseña usando un código verificado
   */
  async resetPassword(email, code, newPassword) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.RESET_PASSWORD), {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({ 
          Correo: (email || '').trim(),
          Codigo: String(code || '').trim(),
          NuevaClave: newPassword,
          ConfirmarClave: newPassword
        }),
      })
      // Parseo robusto: responder correctamente con cuerpo vacío o no-JSON
      const rawText = await response.text()
      let data = {}
      try {
        data = rawText ? JSON.parse(rawText) : {}
      } catch {
        data = {}
      }

      if (!response.ok) {
        const message = data.mensaje || data.Mensaje || rawText || 'Error al restablecer la contraseña'
        throw new Error(message)
      }

      return data
    } catch (error) {
      console.error('Error en resetPassword:', error)
      throw error
    }
  }

  /**
   * Verifica si un usuario existe en la API
   */
  async checkUserExists(email) {
    try {
      const response = await fetch(buildApiUrl(`/users/check?email=${encodeURIComponent(email)}`), {
        method: 'GET',
        headers: DEFAULT_HEADERS,
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return data.exists
    } catch (error) {
      console.error('Error en checkUserExists:', error)
      return false
    }
  }
}

// Exportar una instancia singleton
export const authService = new AuthService()
export default authService
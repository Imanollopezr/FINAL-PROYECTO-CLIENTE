import React, { createContext, useContext, useState, useEffect } from 'react'
import { API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '../../../constants/apiConstants'
import authService from '../../../services/authService'
import PermisosService from '../../../services/permisosService'
import { setToken as setStoreToken, getToken as getStoreToken, clearToken as clearStoreToken } from '../tokenStore'
import { normalizeRoleName } from '../../../shared/utils/roleRouting'

// Contexto de autenticación
const AuthContext = createContext(null)

// Proveedor de autenticación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    id: 'visitante',
    name: 'Visitante',
    email: null,
    role: 'Visitante',
    image: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState(null)
  const [permisos, setPermisos] = useState([])

  // Verificar sesión preguntando al backend (cookies HttpOnly) y cargar permisos sin usar localStorage
  useEffect(() => {
    const loadPermisosPorRol = async (rolId) => {
      try {
        const rolIdNum = parseInt(rolId, 10)
        if (!Number.isFinite(rolIdNum) || rolIdNum <= 0) {
          setPermisos([])
          return
        }
        const resp = await PermisosService.obtenerPermisosPorRol(rolIdNum)
        const objetos = Array.isArray(resp) ? resp : []
        const nombres = objetos.map(p => p.nombre || p.Nombre).filter(Boolean)
        setPermisos(nombres)
      } catch (e) {
        setPermisos([])
      }
    }
    const checkSession = async () => {
      try {
        // Primero intentar refrescar el token usando la cookie HttpOnly
        let refreshedToken = null
        try {
          const refreshResp = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.REFRESH_TOKEN), {
            method: 'POST',
            headers: DEFAULT_HEADERS,
            credentials: 'include',
            body: JSON.stringify({})
          })
          if (refreshResp.ok) {
            const raw = await refreshResp.text()
            let data = {}
            try { data = raw ? JSON.parse(raw) : {} } catch { data = {} }
            const tokenFromResp =
              data?.data?.token || data?.Data?.Token || data?.token || data?.Token || null
            if (tokenFromResp) {
              refreshedToken = tokenFromResp
              setStoreToken(tokenFromResp)
              setToken(tokenFromResp)
            }
          }
        } catch { /* ignorar errores de refresh */ }

        const bearerToken = refreshedToken || getStoreToken() || token
        const headersWithAuth = bearerToken
          ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${bearerToken}` }
          : { ...DEFAULT_HEADERS }

        // Luego pedir el perfil con Authorization si tenemos token
        const profileResponse = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.PROFILE), {
          method: 'GET',
          headers: headersWithAuth,
          credentials: 'include'
        })

        if (profileResponse.ok) {
          const profileData = await profileResponse.json().catch(() => ({}))
          if (profileData.exitoso && profileData.data) {
            const userInfo = profileData.data
            const userRole = normalizeRoleName(userInfo.nombreRol || userInfo.rol || 'Usuario')
            setUser({
              id: userInfo.id.toString(),
              name: `${userInfo.nombres || ''} ${userInfo.apellidos || ''}`.trim() || 'Usuario',
              nombres: userInfo.nombres || '',
              apellidos: userInfo.apellidos || '',
              email: userInfo.correo,
              role: userRole,
              rolId: userInfo.idRol || userInfo.IdRol,
              image: userInfo.imagenUrl || userInfo.ImagenUrl || userInfo.imagen || userInfo.Imagen || null
            })
            setIsAuthenticated(true)
            await loadPermisosPorRol(userInfo.idRol || userInfo.IdRol)
          } else {
            setUser({ id: 'visitante', name: 'Visitante', email: null, role: 'Visitante', image: null })
            setIsAuthenticated(false)
            setPermisos([])
          }
        } else {
          setUser({ id: 'visitante', name: 'Visitante', email: null, role: 'Visitante', image: null })
          setIsAuthenticated(false)
          setPermisos([])
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error)
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  // Función de login
  const login = async (email, password) => {
    setIsLoading(true)
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.LOGIN), {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        credentials: 'include',
        body: JSON.stringify({
          Correo: (email || '').trim().toLowerCase(),
          Clave: password
        })
      })

      if (response.ok) {
        const responseData = await response.json()
        
        // La respuesta del backend tiene la estructura: { exitoso, mensaje, data }
        if (responseData.exitoso && responseData.data) {
          const userData = responseData.data
          const userInfo = userData.usuario // El usuario está en userData.usuario
          
          // Debug: Verificar la estructura de datos recibida
          console.log('🔍 DEBUG - Datos recibidos del backend:');
          console.log('responseData:', responseData);
          console.log('userData:', userData);
          console.log('userInfo:', userInfo);
          console.log('nombreRol:', userInfo.nombreRol);
          
          // El rol viene en nombreRol desde el backend
          const userRole = normalizeRoleName(userInfo.nombreRol || 'Usuario')
          
          console.log('🎯 DEBUG - Rol final asignado:', userRole);
          
          const user = {
            id: userInfo.id.toString(),
            name: `${userInfo.nombres} ${userInfo.apellidos}`.trim(),
            nombres: userInfo.nombres || '',
            apellidos: userInfo.apellidos || '',
            email: userInfo.correo,
            role: userRole,
            image: userInfo.imagenUrl || userInfo.ImagenUrl || userInfo.imagen || userInfo.Imagen || null
          }
          
          // Debug: Verificar el usuario final
          console.log('👤 DEBUG - Usuario final creado:', user);
          console.log('✅ DEBUG - Rol confirmado en usuario:', user.role);
          
          setUser({ ...user, rolId: userInfo.idRol || userInfo.IdRol })
          setToken(userData.token)
          setStoreToken(userData.token)
          setIsAuthenticated(true)
          try {
            const rolId = userInfo.idRol || userInfo.IdRol
            const resp = await PermisosService.obtenerPermisosPorRol(parseInt(rolId, 10))
            const nombres = (Array.isArray(resp) ? resp : []).map(p => p.nombre || p.Nombre).filter(Boolean)
            setPermisos(nombres)
          } catch { void 0 }

          return { success: true, user: user }
        } else {
          return { success: false, error: responseData.mensaje || 'Error en la autenticación' }
        }
      } else {
        let fallbackMsg = 'Error en la autenticación'
        try {
          const raw = await response.text()
          try {
            const data = raw ? JSON.parse(raw) : {}
            fallbackMsg = data?.mensaje || data?.Mensaje || data?.error || data?.Error || fallbackMsg
          } catch {
            fallbackMsg = raw || fallbackMsg
          }
        } catch {}

        try {
          const base = (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8091').replace(/\/$/, '')
          const directResp = await fetch(`${base}${API_ENDPOINTS.AUTH.LOGIN}`, {
            method: 'POST',
            headers: DEFAULT_HEADERS,
            credentials: 'include',
            body: JSON.stringify({
              Correo: (email || '').trim().toLowerCase(),
              Clave: password
            })
          })

          if (directResp.ok) {
            const responseData = await directResp.json()
            if (responseData.exitoso && responseData.data) {
              const userData = responseData.data
              const userInfo = userData.usuario
              const userRole = userInfo.nombreRol || 'Usuario'
              const user = {
                id: userInfo.id.toString(),
                name: `${userInfo.nombres} ${userInfo.apellidos}`.trim(),
                nombres: userInfo.nombres || '',
                apellidos: userInfo.apellidos || '',
                email: userInfo.correo,
                role: userRole,
                image: userInfo.imagenUrl || userInfo.ImagenUrl || userInfo.imagen || userInfo.Imagen || null
              }
              setUser({ ...user, rolId: userInfo.idRol || userInfo.IdRol })
              setToken(userData.token)
              setStoreToken(userData.token)
              setIsAuthenticated(true)
              try {
                const rolId = userInfo.idRol || userInfo.IdRol
                const resp = await PermisosService.obtenerPermisosPorRol(parseInt(rolId, 10))
                const nombres = (Array.isArray(resp) ? resp : []).map(p => p.nombre || p.Nombre).filter(Boolean)
                setPermisos(nombres)
              } catch { void 0 }
              return { success: true, user }
            }
          }
        } catch {}

        return { success: false, error: fallbackMsg }
      }
    } catch (error) {
      console.error('Error en login:', error)
      
      return { success: false, error: 'Error de conexión. Verifique su conexión a internet.' }
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithProvider = async (provider) => {
    setIsLoading(true)
    try {
      // Usar Firebase para Google
      if (provider === 'google') {
        const { signInWithGoogle } = await import('../../../lib/firebase')
        const result = await signInWithGoogle()
        if (!result.success) {
          return { success: false, error: result.error || 'Error en autenticación con Google' }
        }

        const firebaseUser = result.user
        const oauthUser = {
          id: firebaseUser.uid,
          providerId: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email,
          email: firebaseUser.email,
          image: firebaseUser.photoURL,
          provider: 'google'
        }

        // Sincronizar con backend
        const syncResp = await authService.syncOAuthUser(oauthUser)
        if (!syncResp || !syncResp.exitoso || !syncResp.data) {
          return { success: false, error: syncResp?.mensaje || 'Fallo en sincronización OAuth' }
        }

        const userData = syncResp.data.usuario || syncResp.data
        const userRole = userData.nombreRol || userData.rol || 'Usuario'

        const appUser = {
          id: (userData.id || oauthUser.id).toString(),
          name: userData.nombres || oauthUser.name,
          email: userData.correo || oauthUser.email,
          role: userRole,
          rolId: userData.idRol || userData.IdRol,
          image: oauthUser.image || null
        }

        setUser(appUser)
        setIsAuthenticated(true)
        setToken(syncResp.data.token || null)
        setStoreToken(syncResp.data.token || null)
        try {
          const rolId = userData.idRol || userData.IdRol
          const rolIdNum = parseInt(rolId, 10)
          if (Number.isFinite(rolIdNum) && rolIdNum > 0) {
            const resp = await PermisosService.obtenerPermisosPorRol(rolIdNum)
            const nombres = (Array.isArray(resp) ? resp : []).map(p => p.nombre || p.Nombre).filter(Boolean)
            setPermisos(nombres)
          } else {
            setPermisos([])
          }
        } catch (e) {
          setPermisos([])
        }
        return { success: true, user: appUser }
      }

      // Otros proveedores podrían agregarse aquí
      return { success: false, error: 'Proveedor no soportado' }
    } catch (error) {
      console.error('Error en loginWithProvider:', error)
      return { success: false, error: error.message || 'Error en login con proveedor' }
    } finally {
      setIsLoading(false)
    }
  }

  // Función de logout
  const logout = async () => {
    try {
      // Volver al estado de visitante
      setUser({
        id: 'visitante',
        name: 'Visitante',
        email: null,
        role: 'Visitante',
        image: null
      })
      setToken(null)
      clearStoreToken()
      setIsAuthenticated(false)
      setPermisos([])
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const updateUser = async (updatedUserData) => {
    const prevRolId = user?.rolId
    const newUser = { ...user, ...updatedUserData }
    setUser(newUser)
    const nextRolId = newUser?.rolId || updatedUserData?.rolId
    if (nextRolId && nextRolId !== prevRolId) {
      try {
        const resp = await PermisosService.obtenerPermisosPorRol(parseInt(nextRolId, 10))
        const nombres = (Array.isArray(resp) ? resp : []).map(p => p.nombre || p.Nombre).filter(Boolean)
        setPermisos(nombres)
      } catch {
        setPermisos([])
      }
    }
  }

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    permisos,
    login,
    loginWithProvider,
    logout,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado para usar la autenticación
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  
  return context
}

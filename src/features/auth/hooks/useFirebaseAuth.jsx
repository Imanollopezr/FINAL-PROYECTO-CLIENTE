import React, { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, signInWithGoogle, signOut as firebaseSignOut } from '../../../lib/firebase'

// Crear contexto de autenticación
const FirebaseAuthContext = createContext(null)

// Proveedor de autenticación con Firebase
export const FirebaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Escuchar cambios en el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Usuario autenticado
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        }
        setUser(userData)
        setIsAuthenticated(true)
        console.log('Usuario autenticado:', userData)
      } else {
        // Usuario no autenticado
        setUser(null)
        setIsAuthenticated(false)
        console.log('Usuario no autenticado')
      }
      setLoading(false)
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [])

  // Función para iniciar sesión con Google
  const loginWithGoogle = async () => {
    setLoading(true)
    try {
      const result = await signInWithGoogle()
      if (result.success) {
        console.log('Login exitoso con Google')
        // El estado se actualizará automáticamente por onAuthStateChanged
        return { success: true }
      } else {
        console.error('Error en login:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Error inesperado en login:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Función para cerrar sesión
  const logout = async () => {
    setLoading(true)
    try {
      const result = await firebaseSignOut()
      if (result.success) {
        console.log('Logout exitoso')
        // El estado se actualizará automáticamente por onAuthStateChanged
        return { success: true }
      } else {
        console.error('Error en logout:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Error inesperado en logout:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    loginWithGoogle,
    logout
  }

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  )
}

// Hook para usar el contexto de autenticación
export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext)
  if (!context) {
    throw new Error('useFirebaseAuth debe ser usado dentro de FirebaseAuthProvider')
  }
  return context
}

// Funciones de compatibilidad para mantener la API existente
export const signIn = async (provider) => {
  if (provider === 'google') {
    console.log('Iniciando autenticación con Google usando Firebase...')
    try {
      const result = await signInWithGoogle()
      if (result.success) {
        console.log('Autenticación exitosa')
        // Redirigir según permisos/rol evitando dashboard por defecto
        try {
          const { getDefaultRouteByUser } = await import('../../../shared/utils/roleRouting');
          const target = getDefaultRouteByUser();
          window.location.href = target || '/mi-cuenta';
        } catch {
          window.location.href = '/mi-cuenta';
        }
      } else {
        console.error('Error en autenticación:', result.error)
        alert('Error al iniciar sesión con Google: ' + result.error)
      }
    } catch (error) {
      console.error('Error inesperado:', error)
      alert('Error inesperado al iniciar sesión')
    }
  }
}

export const signOut = async () => {
  try {
    const result = await firebaseSignOut()
    if (result.success) {
      window.location.href = '/'
    }
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
  }
}

export const getSession = () => {
  return auth.currentUser
}
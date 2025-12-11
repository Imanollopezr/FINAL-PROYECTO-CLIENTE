import React from 'react'
import { useAuth } from '../hooks/useAuth'

/**
 * Componente de botón de autenticación que muestra login o logout según el estado
 */
const AuthButton = ({ className = '', variant = 'primary' }) => {
  const { isAuthenticated, isLoading, user, logout, loginWithProvider } = useAuth()

  if (isLoading) {
    return (
      <button className={`btn btn-${variant} ${className}`} disabled>
        Cargando...
      </button>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="d-flex align-items-center gap-2">
        <span className="text-light">Hola, {user?.name || user?.email}</span>
        <button 
          className={`btn btn-outline-light ${className}`}
          onClick={logout}
        >
          Cerrar Sesión
        </button>
      </div>
    )
  }

  return (
    <div className="d-flex gap-2">
      <button 
        className={`btn btn-${variant} ${className}`}
        onClick={() => loginWithProvider('google')}
        disabled={isLoading}
      >
        {isLoading ? 'Cargando...' : 'Iniciar con Google'}
      </button>
    </div>
  )
}

export default AuthButton
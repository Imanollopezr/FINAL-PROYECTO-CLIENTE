// Exportaciones principales de la funcionalidad de autenticación

// Hooks
export { useAuth } from './hooks/useAuth'

// Exportar componentes
export { default as AuthButton } from './components/AuthButton'

// Re-exportaciones de next-auth/react para conveniencia
export { useSession, signIn, signOut, getSession } from 'next-auth/react'
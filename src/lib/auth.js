// Configuración específica de NextAuth para el cliente
export const authConfig = {
  baseUrl: 'http://localhost:5000',
  basePath: '/api/auth',
  providers: []
}

// Función para obtener la URL base correcta
export function getAuthUrl(path = '') {
  const baseUrl = 'http://localhost:5000'
  return `${baseUrl}/api/auth${path}`
}

// Configuración global para NextAuth
if (typeof window !== 'undefined') {
  // Sobrescribir cualquier configuración por defecto
  window.__NEXTAUTH = {
    baseUrl: 'http://localhost:5000',
    basePath: '/api/auth'
  }
}
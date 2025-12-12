export const API_BASE_URL = 'http://localhost:8091'
export const DEFAULT_HEADERS = { 'Content-Type': 'application/json' }

export const API_ENDPOINTS = {
  AUTH: { REFRESH_TOKEN: '/api/auth/refresh-token' },
  ROLES: {
    GET_ALL: '/api/roles',
    GET_ALL_WITH_PERMISOS: '/api/roles/permisos',
    GET_BY_ID: '/api/roles/:id',
    CREATE: '/api/roles',
    UPDATE: '/api/roles/:id',
    DELETE: '/api/roles/:id',
    SEARCH: '/api/roles/search/:termino'
  },
  MEDIDAS: {
    GET_ALL: '/api/medidas',
    CREATE: '/api/medidas',
    UPDATE: '/api/medidas/:id',
    CAMBIAR_ESTADO: '/api/medidas/:id/estado',
    DELETE: '/api/medidas/:id'
  },
  PRODUCTO_VARIANTES: {
    OBTENER_PRECIO_TALLA: '/api/productos/:id/talla/:talla/precio',
    GUARDAR_PRECIO_TALLA: '/api/productos/:id/talla/precio'
  },
  PRODUCTOS: {
    GET_ALL: '/api/productos',
    CREATE: '/api/productos',
    UPDATE: '/api/productos/:id',
    DELETE: '/api/productos/:id',
    GET_BY_ID: '/api/productos/:id',
    BUSCAR: '/api/productos/buscar/:termino',
    POR_CATEGORIA: '/api/productos/categoria/:categoria'
  },
  PROVEEDORES: {
    GET_ALL: '/api/proveedores',
    CREATE: '/api/proveedores',
    UPDATE: '/api/proveedores/:id',
    DELETE: '/api/proveedores/:id',
    GET_BY_ID: '/api/proveedores/:id',
    BUSCAR: '/api/proveedores/buscar',
    CAMBIAR_ESTADO: '/api/proveedores/:id/estado'
  },
  COLORES: {
    GET_ALL: '/api/colores',
    CREATE: '/api/colores',
    UPDATE: '/api/colores/:id',
    DELETE: '/api/colores/:id',
    GET_BY_ID: '/api/colores/:id',
    CAMBIAR_ESTADO: '/api/colores/:id/estado'
  }
}

export const buildApiUrl = (path) => {
  if (!path) return API_BASE_URL
  return `${API_BASE_URL}${path}`
}

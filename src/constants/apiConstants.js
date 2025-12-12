// Configuración de la API
// Usa variable de entorno VITE_API_URL si existe; fallback adicional a VITE_API_BASE_URL y luego a localhost:8090
const envApiUrl = (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL || '').trim();
// En desarrollo, usamos rutas relativas para que Vite proxyee /api hacia el backend sin CORS
// Nota: en desarrollo usamos rutas relativas para /api (proxy de Vite),
// pero para recursos estáticos (/uploads) debemos apuntar al backend real.
export const API_BASE_URL = import.meta.env?.DEV
  ? ''
  : (envApiUrl ? envApiUrl.replace(/\/$/, '') : 'http://localhost:8090');

// Endpoints de la API (basados en la nueva estructura de la API en C#)
export const API_ENDPOINTS = {
  // Usuarios
  USUARIOS: {
    GET_ALL: '/api/usuarios',
    CREATE: '/api/usuarios',
    UPDATE: '/api/usuarios/:id',
    DELETE: '/api/usuarios/:id',
    GET_BY_ID: '/api/usuarios/:id',
    SEARCH: '/api/usuarios/buscar/:termino'
  },
  
  // Productos (nueva API C#)
  PRODUCTOS: {
    GET_ALL: '/api/productos',
    CREATE: '/api/productos',
    CREATE_WITH_IMAGE: '/api/productos/con-imagen',
    UPDATE: '/api/productos/:id',
    DELETE: '/api/productos/:id',
    GET_BY_ID: '/api/productos/:id',
    BUSCAR: '/api/productos/buscar/:termino',
    POR_CATEGORIA: '/api/productos/categoria/:categoria'
  },
  
  // Categorías
  CATEGORIAS: {
    GET_ALL: '/api/categorias',
    CREATE: '/api/categorias',
    UPDATE: '/api/categorias/:id',
    DELETE: '/api/categorias/:id',
    GET_BY_ID: '/api/categorias/:id'
  },
  // Colores (si el backend expone endpoints separados)
  COLORES: {
    GET_ALL: '/api/colores',
    CREATE: '/api/colores',
    UPDATE: '/api/colores/:id',
    DELETE: '/api/colores/:id',
    GET_BY_ID: '/api/colores/:id',
    CAMBIAR_ESTADO: '/api/colores/:id/estado'
  },
  
  // Medidas
  MEDIDAS: {
    GET_ALL: '/api/medidas',
    CREATE: '/api/medidas',
    UPDATE: '/api/medidas/:id',
    DELETE: '/api/medidas/:id',
    GET_BY_ID: '/api/medidas/:id',
    BUSCAR: '/api/medidas/buscar/:termino',
    CAMBIAR_ESTADO: '/api/medidas/:id/estado'
  },
  PRODUCTO_VARIANTES: {
    GUARDAR_PRECIO_TALLA: '/api/productos/:id/variantes/talla',
    OBTENER_PRECIO_TALLA: '/api/productos/:id/variantes/talla/:talla'
  },
  
  // Marcas
  MARCAS: {
    GET_ALL: '/api/marcas',
    CREATE: '/api/marcas',
    UPDATE: '/api/marcas/:id',
    DELETE: '/api/marcas/:id',
    GET_BY_ID: '/api/marcas/:id',
    BUSCAR: '/api/marcas/buscar/:termino',
    CAMBIAR_ESTADO: '/api/marcas/:id/estado'
  },
  
  // Proveedores (nueva API C#)
  PROVEEDORES: {
    GET_ALL: '/api/proveedores',
    CREATE: '/api/proveedores',
    UPDATE: '/api/proveedores/:id',
    DELETE: '/api/proveedores/:id',
    GET_BY_ID: '/api/proveedores/:id',
    BUSCAR: '/api/proveedores/buscar',
    CAMBIAR_ESTADO: '/api/proveedores/:id/estado'
  },
  
  // Clientes (nueva API C#)
  CLIENTES: {
    GET_ALL: '/api/clientes',
    CREATE: '/api/clientes',
    UPDATE: '/api/clientes/:id',
    DELETE: '/api/clientes/:id',
    GET_BY_ID: '/api/clientes/:id',
    BUSCAR: '/api/clientes/buscar/:termino',
    ME: '/api/clientes/me',
    ME_PEDIDOS: '/api/clientes/me/pedidos',
    PEDIDOS_ADMIN: '/api/clientes/pedidos',
    CONTACTO: '/api/clientes/:id/contacto'
  },
  
  // Roles
  ROLES: {
    GET_ALL: '/api/roles',
    GET_ALL_WITH_PERMISOS: '/api/roles/with-permisos',
    CREATE: '/api/roles',
    UPDATE: '/api/roles/:id',
    DELETE: '/api/roles/:id',
    GET_BY_ID: '/api/roles/:id',
    SEARCH: '/api/roles/buscar/:termino'
  },

  // Permisos
  PERMISOS: {
    GET_ALL: '/api/permisos',
    GET_BY_ID: '/api/permisos/:id',
    CREATE: '/api/permisos',
    UPDATE: '/api/permisos/:id',
    DELETE: '/api/permisos/:id',
    GET_BY_ROL: '/api/permisos/rol/:rolId',
    ASSIGN_TO_ROL: '/api/permisos/rol/assign',
    REMOVE_FROM_ROL: '/api/permisos/rol/remove'
  },
  
  // Ventas
  VENTAS: {
    GET_ALL: '/api/ventas',
    CREATE: '/api/ventas',
    UPDATE: '/api/ventas/:id',
    DELETE: '/api/ventas/:id',
    GET_BY_ID: '/api/ventas/:id'
  },
  
  // Pedidos
  PEDIDOS: {
    GET_ALL: '/api/pedidos',
    CREATE: '/api/pedidos',
    UPDATE: '/api/pedidos/:id',
    DELETE: '/api/pedidos/:id',
    GET_BY_ID: '/api/pedidos/:id',
    CAMBIAR_ESTADO: '/api/pedidos/:id/estado',
    HISTORIAL_ESTADOS: '/api/pedidos/:id/historial',
    CONFIRMAR: '/api/pedidos/:id/confirmar'
  },
  
  // Compras
  COMPRAS: {
    GET_ALL: '/api/compras',
    CREATE: '/api/compras',
    UPDATE: '/api/compras/:id',
    DELETE: '/api/compras/:id',
    GET_BY_ID: '/api/compras/:id',
    POR_PROVEEDOR: '/api/compras/proveedor/:proveedorId',
    POR_FECHA: '/api/compras/fecha/:fecha'
  },
  
  // Carrito
  CARRITO: {
    GET: '/api/carrito',
    AGREGAR_ITEM: '/api/carrito/items',
    ACTUALIZAR_ITEM: '/api/carrito/items/:itemId',
    ELIMINAR_ITEM: '/api/carrito/items/:itemId',
    VACIAR: '/api/carrito',
    PROCESAR_COMPRA: '/api/carrito/procesar-compra'
  },
  
  
  
  // Autenticación
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    VERIFY_CODE: '/api/auth/verify-code',
    RESET_PASSWORD: '/api/auth/reset-password',
    OAUTH_SYNC: '/api/auth/oauth-sync',
    PROFILE: '/api/auth/profile',
    CHANGE_PASSWORD: '/api/auth/change-password',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    LOGOUT: '/api/auth/logout'
  }
  ,
  // Archivos (subidas y manejo de imágenes)
  ARCHIVOS: {
    SUBIR_IMAGEN: '/api/Archivos/subir-imagen',
    SUBIR_AVATAR: '/api/Archivos/subir-avatar',
    ELIMINAR_AVATAR: '/api/Archivos/eliminar-avatar/:nombreArchivo',
    INFO_AVATAR: '/api/Archivos/info-avatar/:nombreArchivo'
  }
  ,
  // Usuarios adicionales
  USUARIOS_EXTRA: {
    MI_IMAGEN: '/api/usuarios/mi-imagen'
  }
};

// Headers por defecto para las peticiones
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Accept': 'application/json'
};

// Función helper para construir URLs completas
export const buildApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const normalizedEndpoint = cleanEndpoint
    .replace(/^\/api\/Auth\b/, '/api/auth')
    .replace(/^\/api\/Usuarios\b/, '/api/usuarios');
  // En desarrollo:
  // - si el endpoint es de API (/api), devolver relativo para que Vite lo proxyee
  // - si es un recurso estático (ej. /uploads), devolver absoluto al backend
  if (import.meta.env?.DEV) {
    // En dev, usa rutas relativas para /api y que Vite proxyee a 8090
    if (normalizedEndpoint.startsWith('/api')) {
      return normalizedEndpoint;
    }
    const devBackend = (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8091').replace(/\/$/, '');
    return `${devBackend}${normalizedEndpoint}`;
  }
  // En producción, usar la URL base configurada
  return `${API_BASE_URL}${normalizedEndpoint}`;
};

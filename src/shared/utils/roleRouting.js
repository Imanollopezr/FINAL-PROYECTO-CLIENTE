// Utilidades para enrutamiento y temas según rol

// Normaliza nombres de rol provenientes del backend o diferentes fuentes
export const normalizeRoleName = (role) => {
  const r = (role || '').trim();
  switch (r) {
    case 'Administrador':
    case 'Admin':
      return 'Administrador';
    case 'Asistente':
      return 'Asistente';
    case 'Usuario':
      return 'Usuario';
    case 'Cliente':
      return 'Cliente';
    default:
      return 'Visitante';
  }
};

export const getDefaultRouteByRole = (role) => {
  const r = normalizeRoleName(role);
  switch (r) {
    case 'Administrador':
    case 'Asistente':
      return '/dashboard';
    case 'Usuario':
      // Usuarios estándar sin permisos específicos van a "Mi Cuenta"
      return '/mi-cuenta';
    case 'Cliente':
      return '/productos-tienda';
    default:
      // Fallback para roles desconocidos
      return '/productos-tienda';
  }
};

// Selección inteligente de ruta por permisos del usuario.
// Lee permisos desde localStorage ('usuarioPermisos') y decide a dónde
// redirigir después del login/inicio según prioridad.
export const getDefaultRouteByUser = () => {
  try {
    const rawPerms = localStorage.getItem('usuarioPermisos');
    const parsed = JSON.parse(rawPerms || '[]');
    const permisos = Array.isArray(parsed) ? parsed : [];

    const has = (name) => permisos.includes(name);

    // Prioridad: ir al primer CRUD disponible por permiso (sin clientes)
    // Usuarios y módulos de gestión del sistema
    if (has('GestionUsuarios')) return '/usuarios';
    if (has('GestionProductos')) return '/productos';
    if (has('GestionCategorias')) return '/categorias';
    if (has('GestionMarcas')) return '/marcas';
    if (has('GestionMedidas')) return '/medidas';
    if (has('GestionProveedores')) return '/proveedores';
    if (has('GestionClientes')) return '/clientes';
    if (has('GestionCompras')) return '/compras';
    if (has('GestionPedidos')) return '/pedidos';
    if (has('GestionRoles')) return '/roles';

    // Si no hay CRUDs específicos, usar dashboard solo para roles administrativos
    try {
      const savedUserRaw = localStorage.getItem('usuarioActual');
      const savedUser = JSON.parse(savedUserRaw || '{}');
      const roleName = savedUser?.nombreRol || savedUser?.rol || 'Visitante';
      const adminRoles = ['Administrador', 'Asistente'];
      if (has('VerDashboard') && adminRoles.includes(roleName)) {
        return '/dashboard';
      }
    } catch {}

    // Fallback por rol del usuario
    try {
      const savedUserRaw = localStorage.getItem('usuarioActual');
      const savedUser = JSON.parse(savedUserRaw || '{}');
      const roleName = savedUser?.nombreRol || savedUser?.rol || 'Visitante';
      return getDefaultRouteByRole(roleName);
    } catch {
      // Fallback público
      return '/productos-tienda';
    }
  } catch {
    return '/productos-tienda';
  }
};

export const getRoleThemeClass = (role) => {
  const r = normalizeRoleName(role);
  switch (r) {
    case 'Administrador':
      return 'role-admin';
    case 'Asistente':
      return 'role-asistente';
    case 'Usuario':
      return 'role-usuario';
    case 'Cliente':
      return 'role-cliente';
    default:
      return 'role-visitante';
  }
};

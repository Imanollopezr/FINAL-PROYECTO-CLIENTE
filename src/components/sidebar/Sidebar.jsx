import { useContext, useEffect, useRef, useCallback } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import HuellaPetLove from "../../assets/images/Huella_Petlove.png";

import {
  MdOutlineClose,
  MdOutlineGridView,
  MdOutlineAssignmentInd,
  MdOutlinePerson,
  MdOutlinePeople,
  MdOutlineShoppingCart,
  MdOutlineShoppingBag,
  MdOutlineRequestQuote,
  MdOutlineCategory,
  MdOutlineInventory,
  MdOutlineListAlt,
  MdOutlineLogout,
  MdOutlineBrandingWatermark,
  MdOutlineSquareFoot,
  MdOutlineCode,
  MdOutlinePhotoLibrary,
} from "react-icons/md";

import { Link, useLocation } from "react-router-dom";
import "./Sidebar.scss";
import { SidebarContext } from "../../context/SidebarContext";
import { useAuth } from "../../features/auth/hooks/useAuth";

const Sidebar = () => {
  useContext(ThemeContext);
  const { isSidebarOpen, closeSidebar } = useContext(SidebarContext);
  const { user, permisos } = useAuth();
  
  const navbarRef = useRef(null);
  const location = useLocation();
  
  // Obtener el rol del usuario
  const userRole = user?.role || 'Usuario';
  const roleNameLc = String(user?.role || user?.Rol || user?.nombreRol || '').toLowerCase();
  
  // Debug: Verificar el rol del usuario en el Sidebar
  console.log('🔍 DEBUG - Sidebar información del usuario:');
  console.log('user completo:', user);
  console.log('userRole obtenido:', userRole);
  
  const permisosUsuario = Array.isArray(permisos) ? permisos : [];

  // Mapeo de elementos del menú a permisos explícitos
  const menuItemToPermiso = {
    'roles': 'GestionRoles',
    'usuarios': 'GestionUsuarios',
    'clientes': 'GestionClientes',
    'proveedores': 'GestionProveedores',
    'compras': 'GestionCompras',
    'ventas': 'GestionVentas',
    'pedidos': 'GestionVentas',
    'productos': 'GestionProductos',
    'categorias': 'GestionCategorias',
    'marcas': 'GestionMarcas',
    'medidas': 'GestionMedidas',
    'tallas': 'GestionMedidas',
    'colores': 'GestionCategorias',
    'inicio': 'VerLanding',
    'catalogo': 'VerLanding',
    'carrito': 'VerLanding',
    'perfil': 'Perfil'
  };

  // Ítems de tienda pública controlados por permisos
  const tiendaPublicItems = ['inicio', 'catalogo', 'carrito'];
  
  // Verificar si el usuario tiene permiso para ver una opción
  const hasPermission = (menuItem) => {
    // Acceso a cuenta siempre disponible para autenticados
    if (menuItem === 'mi-cuenta') return true;

    // Administrador puede ver todos los módulos
    if ((userRole || 'Usuario') === 'Administrador') return true;

    // Ítems de tienda pública controlados por permiso VerLanding
    if (tiendaPublicItems.includes(menuItem)) {
      return permisosUsuario.includes('VerLanding');
    }

    // Perfil controlado por permiso Perfil
    if (menuItem === 'perfil') {
      return permisosUsuario.includes('Perfil');
    }

    // Dashboard requiere permiso explícito
    if (menuItem === 'dashboard') {
      if (userRole === 'Cliente') return false;
      return permisosUsuario.includes('VerDashboard');
    }

    // Resto de módulos controlados 100% por permisos
    const permisoNecesario = menuItemToPermiso[menuItem];
    if (!permisoNecesario) return false;
    const hasAccess = permisosUsuario.includes(permisoNecesario);
    console.log(`🔍 DEBUG - hasPermission('${menuItem}'):`, { userRole, permisoNecesario, permisosUsuario, hasAccess });
    return hasAccess;
  };

  const handleClickOutside = useCallback((event) => {
    if (
      navbarRef.current &&
      !navbarRef.current.contains(event.target) &&
      event.target.className !== "sidebar-open-btn"
    ) {
      closeSidebar();
    }
  }, [navbarRef, closeSidebar]);

  // Cierre de sesión se ejecuta desde otros lugares del UI

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  // Configuración de ítems y módulos
  const itemsConfig = {
    inicio: { path: '/', label: 'Inicio', icon: MdOutlineGridView },
    catalogo: { path: '/productos-tienda', label: 'Catálogo', icon: MdOutlineShoppingBag },
    carrito: { path: '/productos-tienda?carrito=open', label: 'Mi carrito', icon: MdOutlineShoppingCart },
    perfil: { path: '/mi-cuenta', label: 'Perfil', icon: MdOutlinePerson },
    roles: { path: '/roles', label: 'Roles', icon: MdOutlineAssignmentInd },
    usuarios: { path: '/usuarios', label: 'Usuarios', icon: MdOutlinePerson },
    clientes: { path: '/clientes', label: 'Clientes', icon: MdOutlinePeople },
    proveedores: { path: '/proveedores', label: 'Proveedores', icon: MdOutlineAssignmentInd },
    compras: { path: '/compras', label: 'Compras', icon: MdOutlineShoppingCart },
    ventas: { path: '/ventas', label: (roleNameLc === 'cliente' ? 'Compras' : 'Ventas'), icon: MdOutlineShoppingCart },
    pedidos: { path: '/pedidos', label: 'Pedidos', icon: MdOutlineRequestQuote },
    productos: { path: '/productos', label: 'Productos', icon: MdOutlineShoppingBag },
    categorias: { path: '/categorias', label: 'Categorías', icon: MdOutlineCategory },
    marcas: { path: '/marcas', label: 'Marcas', icon: MdOutlineBrandingWatermark },
    medidas: { path: '/medidas', label: 'Medidas', icon: MdOutlineSquareFoot },
    tallas: { path: '/tallas', label: 'Tallas', icon: MdOutlineListAlt },
    colores: { path: '/colores', label: 'Colores', icon: MdOutlinePhotoLibrary },
    'mi-cuenta': { path: '/mi-cuenta', label: 'Mi Cuenta', icon: MdOutlinePerson },
  };

  const modules = [
    { title: 'Acceso', items: ['roles', 'usuarios'] },
    { title: 'Gestión', items: ['clientes', 'proveedores'] },
    { title: 'Operaciones', items: ['compras', 'pedidos', 'ventas'] },
    { title: 'Catálogo', items: ['productos', 'categorias', 'marcas', 'medidas', 'tallas', 'colores'] },
    { title: 'Cuenta', items: ['mi-cuenta'] },
  ];

  return (
    <nav className={`sidebar ${isSidebarOpen ? "sidebar-show" : ""}`} ref={navbarRef}>
      <div className="sidebar-body">
        <div className="sidebar-menu">
          <ul className="menu-list">
            {modules.map((mod) => {
              const visibleItems = mod.items.filter((key) => hasPermission(key));
              if (visibleItems.length === 0) return null;
              return (
                <li key={`mod-${mod.title}`} className="menu-group">
                  <div className="menu-group-title">{mod.title}</div>
                  {visibleItems.map((key) => {
                    const conf = itemsConfig[key];
                    const Icon = conf.icon;
                    const isActive = location.pathname === conf.path || (conf.path.includes('?') && location.pathname === conf.path.split('?')[0]);
                    return (
                      <div key={`item-${key}`} className="menu-item">
                        <Link to={conf.path} className={`menu-link ${isActive ? 'active' : ''}`}>
                          <span className="menu-link-icon"><Icon size={20} /></span>
                          <span className="menu-link-text">{conf.label}</span>
                        </Link>
                      </div>
                    );
                  })}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;

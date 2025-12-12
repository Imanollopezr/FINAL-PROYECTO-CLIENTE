import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../features/auth/hooks/useAuth';
import { getDefaultRouteByUser } from '../shared/utils/roleRouting';
import PermisosService from '../services/permisosService';
import { normalizeRoleName } from '../shared/utils/roleRouting';

function RoleBasedRoute({ allowedRoles = [], requiredPermisos = [], redirectTo = '/login' }) {
  const { isAuthenticated, isLoading, user, permisos } = useAuth();
  
  const [alertShown, setAlertShown] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [permisosList, setPermisosList] = useState(permisos || []);

  // Refrescar permisos del usuario si están vacíos, desactualizados o faltan requeridos
  useEffect(() => {
    const refreshPermisosSiNecesario = async () => {
      try {
        const rawRolId = user?.rolId;
        const rolIdNum = parseInt(rawRolId, 10);
        if (!Number.isFinite(rolIdNum) || rolIdNum <= 0) return;

        const missingRequired = requiredPermisos.some(p => !permisosList.includes(p));
        const needRefresh = (permisosList.length === 0) || missingRequired;
        if (!needRefresh) return;
        setLoadingPerms(true);

        const resp = await PermisosService.obtenerPermisosPorRol(rolIdNum);
        const nombres = Array.isArray(resp) ? resp.map(p => p.nombre || p.Nombre).filter(Boolean) : [];
        setPermisosList(nombres);
      } catch (e) {
        console.warn('No se pudieron refrescar permisos en guard:', e);
      } finally {
        setLoadingPerms(false);
      }
    };
    refreshPermisosSiNecesario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, user?.rolId, redirectTo, JSON.stringify(requiredPermisos)]);

  // Mostrar mensajes claros para 401 (no autenticado) y 403 (sin permisos)
  useEffect(() => {
    if (isLoading || loadingPerms || alertShown) return;

    // 401: sesión requerida
    if (!isAuthenticated) {
      Swal.fire({
        icon: 'warning',
        title: 'Sesión requerida',
        text: 'No autorizado (401). Inicia sesión o tu sesión expiró.'
      });
      setAlertShown(true);
      return;
    }

    // 403: sin permisos suficientes (roles)
    if (allowedRoles.length > 0) {
      const userRole = normalizeRoleName(user?.role || 'Usuario');
      const hasPermission = allowedRoles.map(normalizeRoleName).includes(userRole);
      if (!hasPermission) {
        // Si hay redirección configurada, no mostrar modal 403 (evita superponerse en la pantalla destino)
        if (!redirectTo) {
          Swal.fire({
            icon: 'error',
            title: 'Acceso denegado',
            text: 'Acceso denegado (403). No tienes permisos suficientes.'
          });
          setAlertShown(true);
        }
      }
    }

    // 403: sin permisos suficientes (permisos explícitos)
    if (!alertShown && requiredPermisos.length > 0 && !loadingPerms) {
      const missing = requiredPermisos.filter(p => !permisosList.includes(p));
      if (missing.length > 0) {
        // Si hay redirección configurada, no mostrar modal 403
        if (!redirectTo) {
          Swal.fire({
            icon: 'error',
            title: 'Acceso denegado',
            text: 'Acceso denegado (403). Te faltan permisos requeridos.'
          });
          setAlertShown(true);
        }
      }
    }
  }, [isLoading, isAuthenticated, allowedRoles, requiredPermisos, user, alertShown, permisosList, loadingPerms]);
  
  // Mostrar loading mientras se verifica la sesión
  if (isLoading || loadingPerms) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }
  
  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Si no se especifican roles, pero sí permisos, validar permisos
  if (allowedRoles.length === 0 && requiredPermisos.length > 0) {
    // Administrador: bypass de permisos explícitos
    if (normalizeRoleName(user?.role || 'Usuario') === 'Administrador') {
      return <Outlet />;
    }
    const missing = requiredPermisos.filter(p => !permisosList.includes(p));
    if (missing.length > 0) {
      const fallback = redirectTo || getDefaultRouteByUser();
      return <Navigate to={fallback} />;
    }
    return <Outlet />;
  }
  
  // Verificar si el usuario tiene uno de los roles permitidos
  const userRole = normalizeRoleName(user?.role || 'Usuario');
  const hasPermission = allowedRoles.map(normalizeRoleName).includes(userRole);
  // Y verificar permisos si se requieren
  const missingPerms = requiredPermisos.filter(p => !permisosList.includes(p));
  
  // Si no tiene permisos, redirigir a la página especificada
  if (
    // Administrador siempre accede
    userRole !== 'Administrador' &&
    (!hasPermission || (requiredPermisos.length > 0 && missingPerms.length > 0))
  ) {
    const fallback = redirectTo || getDefaultRouteByUser();
    return <Navigate to={fallback} />;
  }
  
  return <Outlet />;
}

export default RoleBasedRoute;

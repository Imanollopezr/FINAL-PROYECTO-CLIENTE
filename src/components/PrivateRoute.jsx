import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
// Eliminado: dependencias de token/localStorage. Usamos solo la sesión vía API (cookies HttpOnly)

function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  // No usamos token local ni localStorage; la sesión se verifica vía API en useAuth
  
  // Mostrar loading mientras se verifica la sesión
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }
  
  // Permitir acceso solo si está autenticado
  if (isAuthenticated) return <Outlet />;

  // Sin accesos temporales por localStorage

  return <Navigate to="/login" />;
}

export default PrivateRoute;

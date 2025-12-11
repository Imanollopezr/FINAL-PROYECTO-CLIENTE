import React, { useEffect, Suspense } from "react";
import "./App.scss";
import "./shared/styles/uniform-buttons.css";
import "./shared/styles/hover-animations.css";
import "./shared/styles/role-themes.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./features/auth/hooks/useAuth";
import { getDefaultRouteByRole, getRoleThemeClass } from './shared/utils/roleRouting';
// Removido: import { FirebaseAuthProvider } from "./features/auth/hooks/useFirebaseAuth";

// Layout base
import BaseLayout from "./layout/BaseLayout";
import MiCuenta from "./screens/MiCuenta/MiCuenta";

// Pantallas principales protegidas
import { PageNotFound } from "./screens";
import ComprasScreen from "./screens/Compras/ComprasScreen";
import ClientesScreen from "./screens/Clientes/ClientesScreen";
import RolesScreen from "./screens/Roles/RolesScreen";
import UsuariosScreen from "./screens/Usuarios/UsuariosScreen";
import ProveedoresScreen from "./screens/Proveedores/ProveedoresScreen";
import ProductosScreen from "./screens/Productos/ProductosScreen";
import VentasScreen from "./screens/Ventas/VentasScreen";


import CategoriasScreen from "./screens/Categorias/CategoriasScreen";
import MarcasScreen from "./screens/Marcas/MarcasScreen";
// Lazy screens para reducir carga inicial
const Dashboard = React.lazy(() => import('./screens/dashboard/DashboardScreen'));
const MedidasScreen = React.lazy(() => import('./screens/Medidas/MedidasScreen'));
const TallasScreen = React.lazy(() => import('./screens/Tallas/TallasScreen'));
import ColoresScreen from "./screens/Colores/ColoresScreen";


// Pantallas de acceso público

import Login from "./screens/Acceso/Login.jsx";
import Register from "./screens/Acceso/Register.jsx";
import ForgotPassword from "./screens/Acceso/ForgotPassword.jsx";
import VerificarCodigo from './screens/Acceso/VerificarCodigo.jsx';
import RestablecerContrasena from "./screens/Acceso/RestablecerContrasena.jsx";

// 🐾 Landing page y página de productos pública
import ClientesLanding from "./screens/Clientes/ClientesLanding";
import ProductosLanding from "./screens/Clientes/ProductosLanding"; // cuidado: mayúsculas exactas
import BlogDetalle from "./screens/Clientes/BlogDetalle";
import BlogList from "./screens/Clientes/BlogList";
import DondeComprar from "./screens/Clientes/DondeComprar";
import CategoriaVideos from "./screens/Clientes/CategoriaVideos";




// Rutas privadas
import PrivateRoute from "./components/PrivateRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";

function App() {
  const { isAuthenticated, user } = useAuth();

  // Aplicar el tema al body
  useEffect(() => {
    // Clase de tema por rol
    const roleClass = getRoleThemeClass(user?.role);
    document.body.classList.remove('role-admin','role-asistente','role-usuario','role-cliente','role-visitante');
    if (roleClass) document.body.classList.add(roleClass);
  }, [user?.role]);

  return (
    // Removido: <FirebaseAuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >

        <Suspense fallback={<div className="loading">Cargando…</div>}>
        <Routes>

        {/* 🐾 Inicio redirige según permisos del usuario */}
        <Route path="/" element={<ClientesLanding />} />

        {/* Redirección segura si intenta ir a /inicio */}
        <Route path="/inicio" element={
          isAuthenticated ? <Navigate to={getDefaultRouteByRole(user?.role)} replace /> : <Navigate to="/login" replace />
        } />

        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/ForgotPassword" element={<ForgotPassword />} />
        <Route path="/VerificarCodigo" element={<VerificarCodigo />} />
        <Route path="/RestablecerContrasena" element={<RestablecerContrasena />} />

        {/* Landing pública para clientes */}
        <Route path="/landing-cliente" element={<ClientesLanding />} />
        <Route path="/productos-tienda" element={<ProductosLanding />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/donde-comprar" element={<DondeComprar />} />
        <Route path="/blog/:slug" element={<BlogDetalle />} />
        <Route path="/videos-categoria/:categoria" element={<CategoriaVideos />} />
        



        {/* Rutas protegidas - Acceso general para usuarios autenticados */}
        <Route element={<PrivateRoute />}> 
          <Route element={<BaseLayout />}> 
            <Route element={<RoleBasedRoute requiredPermisos={["VerDashboard"]} redirectTo="/mi-cuenta" />}> 
              <Route path="/dashboard" element={<Dashboard />} /> 
            </Route>
            <Route path="/mi-cuenta" element={<MiCuenta />} /> 
            {/* CRUDs protegidos por permisos específicos */}
            <Route element={<RoleBasedRoute requiredPermisos={["GestionCompras"]} redirectTo="/mi-cuenta" />}> 
              <Route path="/compras" element={<ComprasScreen />} /> 
            </Route>
            <Route element={<RoleBasedRoute requiredPermisos={["GestionVentas"]} redirectTo="/mi-cuenta" />}> 
              <Route path="/pedidos" element={<VentasScreen filterByEstado="Pendiente" title="PEDIOS" />} /> 
            </Route>
            <Route element={<RoleBasedRoute requiredPermisos={["GestionClientes"]} redirectTo="/mi-cuenta" />}> 
              <Route path="/clientes" element={<ClientesScreen />} /> 
            </Route>
            <Route element={<RoleBasedRoute requiredPermisos={["GestionProveedores"]} redirectTo="/mi-cuenta" />}> 
              <Route path="/proveedores" element={<ProveedoresScreen />} /> 
            </Route>
            <Route element={<RoleBasedRoute requiredPermisos={["GestionRoles"]} redirectTo="/mi-cuenta" />}> 
              <Route path="/roles" element={<RolesScreen />} /> 
            </Route>
            <Route element={<RoleBasedRoute requiredPermisos={["GestionUsuarios"]} redirectTo="/mi-cuenta" />}> 
              <Route path="/usuarios" element={<UsuariosScreen />} /> 
            </Route>
            <Route element={<RoleBasedRoute requiredPermisos={["GestionProductos"]} redirectTo="/mi-cuenta" />}> 
              <Route path="/productos" element={<ProductosScreen />} /> 
            </Route>
            <Route element={<RoleBasedRoute requiredPermisos={["GestionCategorias"]} redirectTo="/mi-cuenta" />}> 
              <Route path="/categorias" element={<CategoriasScreen />} /> 
              <Route path="/colores" element={<ColoresScreen />} /> 
            </Route>
            <Route element={<RoleBasedRoute requiredPermisos={["GestionMarcas"]} redirectTo="/mi-cuenta" />}> 
              <Route path="/marcas" element={<MarcasScreen />} /> 
            </Route>
            <Route element={<RoleBasedRoute requiredPermisos={["GestionMedidas"]} redirectTo="/mi-cuenta" />}> 
              <Route path="/medidas" element={<MedidasScreen />} /> 
              <Route path="/tallas" element={<TallasScreen />} /> 
            </Route>
            <Route element={<RoleBasedRoute requiredPermisos={["GestionVentas"]} redirectTo="/mi-cuenta" />}> 
              <Route path="/ventas" element={<VentasScreen filterByEstado="Pagado" />} /> 
            </Route>
          </Route>
        </Route>

        {/* Fin rutas protegidas por permisos */}

        {/* Página no encontrada */}
        <Route path="*" element={<PageNotFound />} />
        </Routes>
        </Suspense>
      </Router>
    // Removido: </FirebaseAuthProvider>
  );
}

export default App;

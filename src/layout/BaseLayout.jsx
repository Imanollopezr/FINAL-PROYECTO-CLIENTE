import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "../components";
import Navbar from "../components/Navbar/Navbar"; // ✅ Ruta corregida
import { useAuth } from "../features/auth/hooks/useAuth";
import { } from "react";
import { getRoleThemeClass } from "../shared/utils/roleRouting";
import "./Layout.css";

const BaseLayout = () => {
  const { logout, user } = useAuth();
  const roleClass = getRoleThemeClass(user?.role);
  const navigate = useNavigate();

  const handleLogout = async () => {
    console.log("👋 Cerrar sesión clickeado");
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <main className={`page-wrapper ${roleClass}`}>
      {/* Sidebar */}
      <aside
        className={`bg-white dark:bg-gray-950 shadow-xl border-r border-gray-200 dark:border-gray-800 fixed h-full z-20 w-64`}
      >
        <Sidebar />
      </aside>

      {/* Contenido */}
      <div className={`content-wrapper`}
      >
        {/* Navbar fijo */}
        <header className="sticky top-0 z-30">
          <Navbar onLogout={handleLogout} />
        </header>

        {/* Pantallas dinámicas */}
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </main>
  );
};

export default BaseLayout;

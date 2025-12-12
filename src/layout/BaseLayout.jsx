import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "../components";
import Navbar from "../components/Navbar/Navbar"; // ✅ Ruta corregida
import { useAuth } from "../features/auth/hooks/useAuth";
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
      <Sidebar />

      <div className={`content-wrapper`}>
        <header className="sticky top-0 z-30">
          <Navbar onLogout={handleLogout} />
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </main>
  );
};

export default BaseLayout;

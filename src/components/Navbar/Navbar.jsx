import React, { useContext } from "react";
import { useLocation } from "react-router-dom";
import "./Navbar.scss";
import logo from "../../assets/images/Huella_Petlove.png";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useMemo } from "react";
import { SidebarContext } from "../../context/SidebarContext";

const Navbar = ({ onLogout }) => {
  const { user } = useAuth();
  const location = useLocation();
  const avatarInitial = useMemo(() => {
    const src = user?.name || user?.email || "Usuario";
    const s = String(src).trim();
    return s ? s.charAt(0).toUpperCase() : "U";
  }, [user]);
  
  const { openSidebar } = useContext(SidebarContext);

  return (
    <nav className={`navbar navbar--light`}>
      <div className="navbar-left">
        <button
          className="navbar-toggle"
          aria-label="Abrir menú"
          onClick={openSidebar}
        >
          ☰
        </button>
        <img src={logo} alt="Petlove Logo" className="navbar-logo-img" />
        <span className="navbar-logo-text">PETLOVE</span>
      </div>

      <div className="navbar-right">
        <div className="navbar-avatar">
          {user?.image ? (
            <img src={user.image} alt="" />
          ) : (
            <span>{avatarInitial}</span>
          )}
        </div>
        <span className="navbar-email">
          {user?.email || user?.correo || 'admin@petlove.com'}
        </span>
        <button onClick={onLogout} className="logout-btn">
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

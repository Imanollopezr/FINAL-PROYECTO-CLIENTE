import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from 'framer-motion';
import Swal from "sweetalert2";
import "./RestablecerContrasena.scss";
import { useAuth } from '../../features/auth/hooks/useAuth';
import authService from '../../shared/services/authService';

const RestablecerContrasena = () => {
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Obtener el email del estado de navegación
  const email = location.state?.email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (nuevaContrasena !== confirmarContrasena) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Las contraseñas no coinciden'
      });
      return;
    }

    if (nuevaContrasena.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'La contraseña debe tener al menos 6 caracteres'
      });
      return;
    }

    try {
      // Obtener el correo y código del estado de navegación o localStorage
      const correo = location.state?.correo || localStorage.getItem('resetEmail');
      const codigo = location.state?.codigo || localStorage.getItem('resetCode');

      if (!correo || !codigo) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Información de verificación no encontrada. Por favor, inicia el proceso nuevamente.'
        });
        navigate('/forgot-password');
        return;
      }

      if (import.meta.env?.DEV) {
        console.log('DEV reset context:', { correo, codigo });
      }
      
      // Usar el servicio de autenticación para restablecer la contraseña (normalizando valores)
      await authService.resetPassword(correo?.trim(), String(codigo).trim(), nuevaContrasena);

      // Limpiar datos temporales
      localStorage.removeItem('resetEmail');
      localStorage.removeItem('resetCode');

      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Tu contraseña ha sido restablecida correctamente'
      }).then(() => {
        navigate('/login');
      });

    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo restablecer la contraseña'
      });
    }
  };

  return (
    <div className="reset-password-background">
      <motion.div 
        className="reset-password-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Tarjeta izquierda amarilla */}
        <motion.div 
          className="pet-love-card"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="logo-container">
            <div className="logo-circle">
              <svg className="paw-icon" width="40" height="40" viewBox="0 0 24 24" fill="#2C3E50">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H11V21H5V19H9V17H5V15H11V13H5V11H9V9H5V7H13V9H21Z"/>
              </svg>
            </div>
          </div>
          
          <h1 className="pet-love-title">PetLove</h1>
          <p className="pet-love-subtitle">Conectando corazones peludos</p>
          
          <div className="verification-message">
            <h2>Nueva Contraseña</h2>
            <p>Crea una contraseña segura para proteger tu cuenta y mantener a salvo la información de tus mascotas.</p>
          </div>
          
          <div className="features">
            <div className="feature">
              <span className="feature-icon">🔒</span>
              <span>Seguridad garantizada</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🐾</span>
              <span>Protege a tus mascotas</span>
            </div>
            <div className="feature">
              <span className="feature-icon">💝</span>
              <span>Cuenta segura</span>
            </div>
          </div>
        </motion.div>

        {/* Contenedor del formulario derecho */}
        <motion.div 
          className="reset-form-container"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="reset-form-card">
            <div className="form-header">
              <h2>Restablecer Contraseña</h2>
              <p>Ingresa tu nueva contraseña para completar el proceso de recuperación</p>
            </div>
            
            <form className="reset-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="password">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <circle cx="12" cy="16" r="1"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Ingresa tu nueva contraseña"
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  required
                  minLength="6"
                />
              </div>

              <div className="input-group">
                <label htmlFor="confirmPassword">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <circle cx="12" cy="16" r="1"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirma tu nueva contraseña"
                  value={confirmarContrasena}
                  onChange={(e) => setConfirmarContrasena(e.target.value)}
                  required
                  minLength="6"
                />
              </div>
              
              <motion.button 
                type="submit" 
                className="btn-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Guardar Nueva Contraseña</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </motion.button>
            </form>
            
            <div className="form-footer">
              <div className="divider">
                <span>¿Necesitas ayuda?</span>
              </div>
              
              <motion.button 
                type="button" 
                className="btn-secondary"
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Volver al Login</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RestablecerContrasena;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { getDefaultRouteByUser, getDefaultRouteByRole } from '../../shared/utils/roleRouting';
import authService from '../../services/authService';
import './Login.scss';
// import TestGoogleAuth from '../../components/TestGoogleAuth'; // Componente de prueba removido

const Login = () => {
  const [formData, setFormData] = useState({
    correo: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithProvider } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Usar directamente el método login del contexto de autenticación
      const result = await login(formData.correo, formData.password);
      
      if (result.success) {
        Swal.fire({
          title: '¡Bienvenido!',
          text: 'Has iniciado sesión correctamente',
          icon: 'success',
          confirmButtonText: 'Continuar'
        }).then(() => {
          navigate(getDefaultRouteByUser());
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: result.error || 'Correo o contraseña incorrectos',
          icon: 'error',
          confirmButtonText: 'Intentar de nuevo'
        });
      }
    } catch (error) {
      console.error('Error en login:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al iniciar sesión. Inténtalo de nuevo.',
        icon: 'error',
        confirmButtonText: 'Intentar de nuevo'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setIsLoading(true);
    try {
      // Guard: evitar intentar OAuth si Firebase no está configurado
      if (!isFirebaseConfigured) {
        Swal.fire({
          title: 'Configuración de Firebase incompleta',
          text: 'Para usar Google, completa las variables VITE_FIREBASE_* en tu archivo .env y reinicia npm run dev.',
          icon: 'warning',
          confirmButtonText: 'Entendido'
        });
        return;
      }
      const result = await loginWithProvider(provider);
      if (result.success) {
        Swal.fire({
          title: '¡Bienvenido!',
          text: 'Has iniciado sesión correctamente',
          icon: 'success',
          confirmButtonText: 'Continuar'
        }).then(() => {
          navigate(getDefaultRouteByUser());
        });
      } else {
        Swal.fire({
          title: 'Error de autenticación',
          text: result.error || 'No se pudo iniciar sesión con el proveedor',
          icon: 'error',
          confirmButtonText: 'Intentar de nuevo'
        });
      }
    } catch (error) {
      console.error('Error en OAuth login:', error);
      Swal.fire({
        title: 'Error inesperado',
        text: 'Ocurrió un error al intentar iniciar sesión. Por favor, inténtalo de nuevo.',
        icon: 'error',
        confirmButtonText: 'Intentar de nuevo'
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleLogout = async () => {
    try {
      const { signOut } = await import('../../lib/firebase');
      const result = await signOut();
      
      if (result.success) {
        Swal.fire({
          title: 'Sesión cerrada',
          text: 'Has cerrado sesión exitosamente. Ahora puedes iniciar sesión con otra cuenta.',
          icon: 'success',
          confirmButtonText: 'Entendido'
        });
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  return (
    <div className="login-background">
      {/* Flecha global fuera del formulario */}
      <button
        type="button"
        className="back-button-global"
        aria-label="Regresar a inicio"
        onClick={() => navigate('/')}
      >
        ← Volver al inicio
      </button>
      <div className="login-container">
          {/* Tarjeta amarilla izquierda */}
          <motion.div 
            className="pet-love-card"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="logo-container">
              <div className="logo-circle">
                <svg width="40" height="40" viewBox="0 0 100 100" className="paw-icon">
                  <circle cx="30" cy="30" r="12" fill="white"/>
                  <circle cx="70" cy="30" r="12" fill="white"/>
                  <circle cx="20" cy="60" r="10" fill="white"/>
                  <circle cx="80" cy="60" r="10" fill="white"/>
                  <ellipse cx="50" cy="70" rx="18" ry="15" fill="white"/>
                </svg>
              </div>
            </div>
            <h1 className="pet-love-title">Pet Love</h1>
            <p className="pet-love-subtitle">Tu compañero de confianza</p>
            
            <div className="join-message">
              <h2>¡Únete a nuestra familia!</h2>
              <p>Crea una cuenta y descubre un mundo lleno de amor y cuidado para tus mascotas.</p>
            </div>
            
            <div className="features">
               <div className="feature">
                 <span className="feature-icon">✓</span>
                 <span>Atención especializada</span>
               </div>
               <div className="feature">
                 <span className="feature-icon">✓</span>
                 <span>Cuidado amoroso</span>
               </div>
               <div className="feature">
                 <span className="feature-icon">✓</span>
                 <span>Servicios profesionales</span>
               </div>
             </div>
          </motion.div>

          {/* Formulario de login derecho */}
          <motion.div 
            className="login-form-container"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="login-form-card">
              <div className="form-header">
                <h2>Iniciar Sesión</h2>
                <p>Ingresa tus credenciales para acceder</p>
              </div>
            
              <form className="login-form" onSubmit={handleSubmit}>
                <div className="input-group">
                  <label htmlFor="correo">Correo Electrónico</label>
                  <input
                    type="email"
                    id="correo"
                    name="correo"
                    placeholder="ejemplo@gmail.com"
                    value={formData.correo}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="password">Contraseña</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-options">
                  <button 
                    type="button" 
                    className="forgot-link"
                    onClick={() => navigate('/forgot-password')}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button type="submit" className="btn-login" disabled={isLoading}>
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>

              </form>

              <div className="form-footer">
                <p>¿No tienes cuenta? 
                  <button 
                    onClick={() => navigate('/register')} 
                    className="link-button"
                  >
                    Crear Cuenta
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
  );
};

export default Login;

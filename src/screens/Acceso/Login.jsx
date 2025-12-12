import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { getDefaultRouteByUser } from '../../shared/utils/roleRouting';
import './Login.scss';
// import TestGoogleAuth from '../../components/TestGoogleAuth'; // Componente de prueba removido

const Login = () => {
  const [formData, setFormData] = useState({
    correo: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

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
          showConfirmButton: false,
          timer: 1200,
          timerProgressBar: true
        });
        navigate(getDefaultRouteByUser());
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

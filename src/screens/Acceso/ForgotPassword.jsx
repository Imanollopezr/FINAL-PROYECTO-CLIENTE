import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import './ForgotPassword.scss';
import { useAuth } from '../../features/auth/hooks/useAuth';
import authService from '../../shared/services/authService';

const ForgotPassword = () => {
  const [correo, setCorreo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!correo) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor ingresa tu correo electrónico',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Usar la API del backend para solicitar recuperación de contraseña
      const response = await authService.requestPasswordReset(correo);
      
      setIsLoading(false);
      
      if (response.exitoso) {
        const message = response.mensaje || 'Si el correo existe, se enviará un código de verificación';
        const devCode = response?.data?.devCode;

        Swal.fire({
          title: '¡Solicitud enviada!',
          text: message,
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          navigate('/VerificarCodigo', { 
            state: { 
              email: correo,
              prefillCode: devCode || null
            } 
          });
        });
      } else {
        throw new Error(response.mensaje || 'Error al procesar la solicitud');
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Error al solicitar recuperación:', error);
      
      Swal.fire({
        title: 'Error',
        text: error.message || 'Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  return (
    <div className="forgot-password-background">
      <div className="forgot-password-container">
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
          
          <div className="recovery-message">
            <h2><strong>Recupera tu acceso</strong></h2>
            <p>No te preocupes, te ayudamos a recuperar tu cuenta de forma segura y rápida.</p>
          </div>
          
          <div className="features">
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Proceso seguro</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Acceso rápido</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Siempre contigo</span>
            </div>
          </div>
        </motion.div>

        {/* Formulario de recuperación derecho */}
        <motion.div 
          className="recovery-form-container"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="recovery-form-card">
            <div className="form-header">
              <h2>RECUPERAR CONTRASEÑA</h2>
              <p>Ingresa tu correo electrónico para restablecer tu contraseña</p>
            </div>

            <form className="recovery-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="correo">Correo Electrónico</label>
                <input
                  type="email"
                  id="correo"
                  name="correo"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn-recovery"
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : 'ENVIAR ENLACE'}
              </button>
            </form>

            <div className="form-footer">
              <p>
                ¿Recordaste tu contraseña?{' '}
                <button 
                  type="button" 
                  className="link-button"
                  onClick={() => navigate('/login')}
                >
                  Inicia Sesión
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import './VerificarCodigo.scss';
import { authService } from '../../shared/services/authService';

const VerificarCodigo = () => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Obtener el email y posible código para prefiltro
  const userEmail = location.state?.email;
  const prefillCode = location.state?.prefillCode;
  

  // Verificar si tenemos el email, si no redirigir a ForgotPassword
  useEffect(() => {
    if (!userEmail) {
      navigate('/ForgotPassword');
      return;
    }
    if (prefillCode && typeof prefillCode === 'string' && prefillCode.length === 6) {
      setCode(prefillCode);
    }
  }, [userEmail, prefillCode, navigate]);
            
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Campo requerido',
        text: 'Por favor ingresa el código de verificación',
        confirmButtonColor: '#F4D03F'
      });
      return;
    }

    if (code.length !== 6) {
      Swal.fire({
        icon: 'error',
        title: 'Código inválido',
        text: 'El código debe tener 6 dígitos',
        confirmButtonColor: '#F4D03F'
      });
      return;
    }

    setIsLoading(true);

    try {
      await authService.verifyResetCode(userEmail?.trim(), code.trim());
      
      Swal.fire({
        icon: 'success',
        title: '¡Código verificado!',
        text: 'Ahora puedes crear una nueva contraseña',
        confirmButtonColor: '#F4D03F'
      }).then(() => {
        // Persistir datos para evitar pérdidas de estado en navegación/refresh
        try {
          localStorage.setItem('resetEmail', userEmail);
          localStorage.setItem('resetCode', code);
        } catch {}
        // Navegar a RestablecerContrasena con el email y código
        navigate('/RestablecerContrasena', { 
          state: { 
            correo: userEmail, 
            codigo: code 
          } 
        });
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Código incorrecto',
        text: error.message || 'El código ingresado no es válido. Inténtalo de nuevo.',
        confirmButtonColor: '#F4D03F'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  const handleResendCode = async () => {
    setIsResending(true);
    
    try {
      const resp = await authService.requestPasswordReset(userEmail);
      if (import.meta.env?.DEV) {
        const devCode = resp?.Data?.devCode || resp?.devCode || null;
        if (devCode) {
          console.log('DEV reset code:', devCode);
        }
      }
      
      Swal.fire({
        icon: 'success',
        title: '¡Código reenviado!',
        text: `Se ha enviado un nuevo código de verificación a ${userEmail}`,
        confirmButtonColor: '#F4D03F'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al reenviar',
        text: error.message || 'No se pudo reenviar el código. Inténtalo de nuevo.',
        confirmButtonColor: '#F4D03F'
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="verify-code-background">
      <div className="verify-code-container">
        {/* Sección izquierda - Tarjeta amarilla */}
        <motion.div 
          className="pet-love-card"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
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
          
          <div className="verification-message">
            <h2><strong>Verifica tu código</strong></h2>
            <p>Hemos enviado un código de 6 dígitos a tu correo electrónico. Ingrésalo para continuar.</p>
          </div>
          
          <div className="features">
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Código seguro</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Verificación rápida</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Acceso protegido</span>
            </div>
          </div>
        </motion.div>

        {/* Sección derecha - Formulario */}
        <motion.div 
          className="verify-form-container"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="verify-form-card">
          <div className="form-header">
            <h2>Código de Verificación</h2>
            <p>Enviado a: <strong>{userEmail}</strong></p>
          </div>
            
            <form className="verify-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="code">Código de 6 dígitos</label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="123456"
                  maxLength="6"
                  className="code-input"
                  disabled={isLoading}
                />
              </div>
              
              <button 
                type="submit" 
                className="submit-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Verificando...' : 'Verificar Código'}
              </button>
            </form>
            
            <div className="form-footer">
              <button 
                type="button" 
                className="back-link"
                onClick={() => navigate('/ForgotPassword')}
                disabled={isLoading}
              >
                ← Volver al formulario anterior
              </button>
              
              <button 
                type="button" 
                className="resend-link"
                onClick={handleResendCode}
                disabled={isLoading || isResending}
              >
                {isResending ? 'Reenviando...' : '¿No recibiste el código? Reenviar'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default VerificarCodigo;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { useAuth } from '../../features/auth/hooks/useAuth';
import authService from '../../services/authService.js';
import { getDefaultRouteByRole } from '../../shared/utils/roleRouting';
import './Register.scss';
import { v4 as uuidv4 } from 'uuid';

const Register = () => {
  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  // Manejo de cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validación de contraseñas
  const validatePasswords = () => {
    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        title: 'Error',
        text: 'Las contraseñas no coinciden',
        icon: 'error',
        confirmButtonText: 'Intentar de nuevo'
      });
      return false;
    }
    return true;
  };



  // Mostrar mensaje de éxito y auto-login
  const showSuccessMessage = async (registerResponse) => {
    // Mensaje de bienvenida indicando el rol visible como "Mi Perfil"
    Swal.fire({
      title: '¡Bienvenido! 🎉',
      html: '<b>Tu cuenta fue creada correctamente.</b><br/>Tu rol es <span style="color:#ffb300;font-weight:700;">Mi Perfil</span>.',
      icon: 'success',
      timer: 2500,
      showConfirmButton: false
    });
    
    // Auto-login después del registro
    setTimeout(async () => {
      // Extraer datos del usuario de la respuesta del backend de forma robusta
      const respData = registerResponse?.data || registerResponse?.Data || registerResponse;
      const usuarioInfo = respData?.usuario || respData?.Usuario;
      const registeredEmail = usuarioInfo?.correo || usuarioInfo?.Correo || formData.correo;

      const loginResult = await login(registeredEmail, formData.password);
      if (loginResult.success) {
        // Generar token de bienvenida para permitir acceso a Mi Cuenta temporalmente
        const welcomeToken = uuidv4();
        const welcomeExpMs = 12 * 60 * 60 * 1000; // 12 horas
        const welcomeExpAt = Date.now() + welcomeExpMs;
        localStorage.setItem('welcomeToken', welcomeToken);
        localStorage.setItem('welcomeTokenExp', String(welcomeExpAt));

        // Guardar mensaje de bienvenida mostrado para evitar duplicarlo
        localStorage.setItem('welcomeShown', '1');

        // Marcar visitante como Cliente en localStorage para experiencia de landing
        localStorage.setItem('rolVisitante', 'Cliente');

        // Redirigir a landing pública de productos
        navigate('/productos-tienda');
      } else {
        navigate('/login');
      }
    }, 2000);
  };

  // Manejo del envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validar que todos los campos requeridos estén completos
      if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.correo.trim() || !formData.password.trim()) {
        Swal.fire({
          title: 'Campos requeridos',
          text: 'Nombre, apellido, correo y contraseña son requeridos',
          icon: 'warning',
          confirmButtonText: 'Entendido'
        });
        setIsLoading(false);
        return;
      }

      // Validar contraseñas
      if (!validatePasswords()) {
        setIsLoading(false);
        return;
      }
      
      // Preparar datos para la API
      const userData = {
        Nombres: formData.nombre.trim(),
        Apellidos: formData.apellido.trim(),
        Correo: formData.correo.toLowerCase().trim(),
        Clave: formData.password,
        ConfirmarClave: formData.confirmPassword,
        IdRol: 3 // Rol de Usuario por defecto
      };
      
      // Registrar usuario en la API
      const response = await authService.registerUser(userData);
      
      if (response) {
        // Mostrar mensaje de éxito y auto-login
        await showSuccessMessage(response);
      }
    } catch (error) {
      console.error('Error en registro:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'Error al crear la cuenta. Inténtalo de nuevo.',
        icon: 'error',
        confirmButtonText: 'Intentar de nuevo'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-background">
      <div className="register-container">
        {/* ===== SECCIÓN IZQUIERDA - INFORMACIÓN DE LA MARCA ===== */}
        <motion.div 
          className="pet-love-card"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Logo de Pet Love */}
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
          
          {/* Título y subtítulo */}
          <h1 className="pet-love-title">Pet Love</h1>
          <p className="pet-love-subtitle">Tu compañero de confianza</p>
          
          {/* Mensaje de bienvenida */}
          <div className="join-message">
            <h2>¡Únete a nuestra familia!</h2>
            <p>Crea una cuenta y descubre un mundo lleno de amor y cuidado para tus mascotas.</p>
          </div>
          
          {/* Características del servicio */}
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
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Veterinarios certificados</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Disponibilidad 24/7</span>
            </div>
          </div>
          
          {/* Mensaje adicional */}
          <div className="additional-info">
            <p>🐾 Más de 10,000 mascotas felices</p>
            <p>⭐ Calificación 5 estrellas</p>
          </div>
        </motion.div>

        {/* ===== SECCIÓN DERECHA - FORMULARIO DE REGISTRO ===== */}
        <motion.div 
          className="register-form-container"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="register-form-card">
            {/* Encabezado del formulario */}
            <div className="form-header">
              <h2>Crear Cuenta</h2>
              <p>Completa los datos para registrarte</p>
            </div>
          
            {/* Formulario de registro */}
            <form className="register-form" onSubmit={handleSubmit}>
              {/* Campo: Nombre */}
              <div className="input-group">
                <label htmlFor="nombre">Nombre</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  placeholder="Tu nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  autoComplete="given-name"
                />
              </div>

              {/* Campo: Apellido */}
              <div className="input-group">
                <label htmlFor="apellido">Apellido</label>
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  placeholder="Tu apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                  autoComplete="family-name"
                />
              </div>

              {/* Campo: Correo electrónico */}
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
                  autoComplete="email"
                />
              </div>

              {/* Campo: Contraseña */}
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
                  autoComplete="new-password"
                  minLength="6"
                />
              </div>

              {/* Campo: Confirmar contraseña */}
              <div className="input-group">
                <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  minLength="6"
                />
              </div>

              {/* Botón de envío */}
              <button type="submit" className="btn-register" disabled={isLoading}>
                {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </button>
            </form>

            {/* Pie del formulario - Enlace a login */}
            <div className="form-footer">
              <p>¿Ya tienes cuenta? 
                <button 
                  type="button"
                  onClick={() => navigate('/login')} 
                  className="link-button"
                >
                  Iniciar Sesión
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;

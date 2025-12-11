import React, { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import usuariosService from '../services/usuariosService';
import authService from '../services/authService';
import Swal from 'sweetalert2';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/apiConstants';
import './UsuarioManager.scss';

const UsuarioManager = () => {
  // Estados principales
  const { user: authUser, updateUser } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para modales
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Estados para formularios
  const [loginForm, setLoginForm] = useState({ correo: '', clave: '' });
  const [registerForm, setRegisterForm] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    clave: '',
    confirmarClave: ''
  });
  const [editForm, setEditForm] = useState({
    id: '',
    nombres: '',
    apellidos: '',
    correo: '',
    clave: '',
    idRol: 1,
    activo: true
  });
  
  // Estados para usuario actual y detalles
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [usuarioDetalles, setUsuarioDetalles] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  // Cargar usuarios al montar el componente
  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Función para cargar todos los usuarios
  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usuariosService.obtenerTodos();
      setUsuarios(data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setError('Error al cargar la lista de usuarios');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los usuarios'
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el login
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!loginForm.correo || !loginForm.clave) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Por favor complete todos los campos'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await usuariosService.login(loginForm);
      
      if (response.success) {
        setUsuarioActual(response.data);
        localStorage.setItem('usuario', JSON.stringify(response.data));
        
        Swal.fire({
          icon: 'success',
          title: '¡Bienvenido!',
          text: `Hola ${response.data.nombres}`,
          timer: 2000
        });
        
        setShowLoginModal(false);
        setLoginForm({ correo: '', clave: '' });
        cargarUsuarios(); // Recargar usuarios después del login
      }
    } catch (error) {
      console.error('Error en login:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de autenticación',
        text: error.message || 'Credenciales inválidas'
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el registro
  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!registerForm.nombres || !registerForm.apellidos || !registerForm.correo || !registerForm.clave) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Por favor complete todos los campos obligatorios'
      });
      return;
    }

    if (registerForm.clave !== registerForm.confirmarClave) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Las contraseñas no coinciden'
      });
      return;
    }

    if (registerForm.clave.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseña débil',
        text: 'La contraseña debe tener al menos 6 caracteres'
      });
      return;
    }

    try {
      setLoading(true);
      
      // Verificar si el correo ya existe
      const correoExiste = await usuariosService.validarCorreoExistente(registerForm.correo);
      if (correoExiste) {
        Swal.fire({
          icon: 'error',
          title: 'Usuario existente',
          text: 'Ya existe un usuario con este correo electrónico'
        });
        return;
      }

      const datosRegistro = {
        nombres: registerForm.nombres,
        apellidos: registerForm.apellidos,
        correo: registerForm.correo,
        clave: registerForm.clave,
        confirmarClave: registerForm.clave,
        idRol: 3 // Rol de cliente por defecto
      };

      const response = await usuariosService.registrar(datosRegistro);
      
      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: '¡Registro exitoso!',
          text: 'Usuario creado correctamente',
          timer: 2000
        });
        
        setShowRegisterModal(false);
        setRegisterForm({
          nombres: '',
          apellidos: '',
          correo: '',
          clave: '',
          confirmarClave: ''
        });
        
        cargarUsuarios(); // Recargar la lista de usuarios
      }
    } catch (error) {
      console.error('Error en registro:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error en el registro',
        text: error.message || 'No se pudo crear el usuario'
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar logout
  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro de que quieres cerrar sesión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setUsuarioActual(null);
        localStorage.removeItem('usuario');
        Swal.fire({
          icon: 'success',
          title: 'Sesión cerrada',
          text: 'Has cerrado sesión correctamente',
          timer: 1500
        });
      }
    });
  };

  // Función para abrir modal de edición
  const abrirModalEdicion = (usuario) => {
    setEditForm({
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      clave: '',
      idRol: usuario.idRol || 1,
      activo: usuario.activo
    });
    setShowEditModal(true);
  };

  // Función para manejar la edición de usuario
  const handleEdit = async (e) => {
    e.preventDefault();
    
    if (!editForm.nombres || !editForm.apellidos || !editForm.correo) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Por favor complete todos los campos obligatorios'
      });
      return;
    }

    try {
      setLoading(true);
      
      const datosActualizacion = {
        nombres: editForm.nombres,
        apellidos: editForm.apellidos,
        correo: editForm.correo,
        idRol: editForm.idRol,
        activo: editForm.activo
      };

      // Solo incluir la clave si se proporcionó una nueva
      if (editForm.clave && editForm.clave.trim() !== '') {
        datosActualizacion.clave = editForm.clave;
      }

      const response = await usuariosService.actualizar(editForm.id, datosActualizacion);
      
      if (response?.usuario) {
        Swal.fire({
          icon: 'success',
          title: 'Usuario actualizado',
          text: 'Los datos se han actualizado correctamente',
          timer: 2000
        });
        
        try {
          if (String(authUser?.id) === String(editForm.id)) {
            await updateUser({ rolId: editForm.idRol, role: response.usuario?.nombreRol || response.usuario?.NombreRol })
          }
        } catch {}

        setShowEditModal(false);
        cargarUsuarios();
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo actualizar el usuario'
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar usuario
  const eliminarUsuario = async (id, nombre) => {
    const result = await Swal.fire({
      title: '¿Eliminar usuario?',
      text: `¿Estás seguro de que quieres eliminar a ${nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await usuariosService.eliminar(id);
        
        Swal.fire({
          icon: 'success',
          title: 'Usuario eliminado',
          text: 'El usuario ha sido eliminado correctamente',
          timer: 2000
        });
        
        cargarUsuarios();
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'No se pudo eliminar el usuario'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Función para cambiar estado del usuario
  const cambiarEstadoUsuario = async (id, nombre, estadoActual) => {
    const nuevoEstado = !estadoActual;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    
    const result = await Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario?`,
      text: `¿Estás seguro de que quieres ${accion} a ${nombre}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await usuariosService.cambiarEstado(id, nuevoEstado);
        
        Swal.fire({
          icon: 'success',
          title: `Usuario ${nuevoEstado ? 'activado' : 'desactivado'}`,
          text: `El usuario ha sido ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`,
          timer: 2000
        });
        
        cargarUsuarios();
      } catch (error) {
        console.error('Error al cambiar estado:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'No se pudo cambiar el estado del usuario'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Función para ver detalles del usuario
  const verDetalles = async (id) => {
    try {
      setLoading(true);
      const usuario = await usuariosService.obtenerPorId(id);
      setUsuarioDetalles(usuario);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error al obtener detalles:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los detalles del usuario'
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para buscar usuarios
  const buscarUsuarios = async () => {
    if (!busqueda.trim()) {
      cargarUsuarios();
      return;
    }

    try {
      setLoading(true);
      const resultados = await usuariosService.buscar(busqueda);
      setUsuarios(resultados);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al buscar usuarios'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuarios por búsqueda local
  const usuariosFiltrados = usuarios.filter(usuario =>
    usuario.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
    usuario.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
    usuario.correo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="usuario-manager">
      {/* Header con información del usuario actual */}
      <div className="header">
        <h1>Gestión de Usuarios</h1>
        <div className="user-info">
          {usuarioActual ? (
            <div className="logged-user">
              <span>Bienvenido, {usuarioActual.nombres}</span>
              <button onClick={handleLogout} className="btn btn-outline">
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <button 
                onClick={() => setShowLoginModal(true)} 
                className="btn btn-primary"
              >
                Iniciar Sesión
              </button>
              <button 
                onClick={() => setShowRegisterModal(true)} 
                className="btn btn-secondary"
              >
                Registrarse
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barra de búsqueda y acciones */}
      <div className="toolbar">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="search-input"
          />
          <button onClick={buscarUsuarios} className="btn btn-search">
            Buscar
          </button>
          <button onClick={cargarUsuarios} className="btn btn-refresh">
            Actualizar
          </button>
        </div>
      </div>

      {/* Loading y Error */}
      {loading && <div className="loading">Cargando...</div>}
      {error && <div className="error">{error}</div>}

      {/* Tabla de usuarios */}
      <div className="usuarios-table-container">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Correo</th>
              <th>Estado</th>
              <th>Fecha Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((usuario) => (
              <tr key={usuario.id}>
                <td>{usuario.id}</td>
                <td>{usuario.nombres}</td>
                <td>{usuario.apellidos}</td>
                <td>{usuario.correo}</td>
                <td>
                  <span className={`status ${usuario.activo ? 'active' : 'inactive'}`}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>{new Date(usuario.fechaRegistro).toLocaleDateString()}</td>
                <td className="actions">
                  <button 
                    onClick={() => verDetalles(usuario.id)}
                    className="btn btn-info btn-sm"
                    title="Ver detalles"
                  >
                    👁️
                  </button>
                  <button 
                    onClick={() => abrirModalEdicion(usuario)}
                    className="btn btn-warning btn-sm"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => cambiarEstadoUsuario(usuario.id, usuario.nombres, usuario.activo)}
                    className={`btn btn-sm ${usuario.activo ? 'btn-warning' : 'btn-success'}`}
                    title={usuario.activo ? 'Desactivar' : 'Activar'}
                  >
                    {usuario.activo ? '🔒' : '🔓'}
                  </button>
                  <button 
                    onClick={() => eliminarUsuario(usuario.id, usuario.nombres)}
                    className="btn btn-danger btn-sm"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {usuariosFiltrados.length === 0 && !loading && (
          <div className="no-data">No se encontraron usuarios</div>
        )}
      </div>

      {/* Modal de Login */}
      {showLoginModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Iniciar Sesión</h2>
              <button 
                onClick={() => setShowLoginModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleLogin} className="modal-body">
              <div className="form-group">
                <label>Correo Electrónico:</label>
                <input
                  type="email"
                  value={loginForm.correo}
                  onChange={(e) => setLoginForm({...loginForm, correo: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contraseña:</label>
                <input
                  type="password"
                  value={loginForm.clave}
                  onChange={(e) => setLoginForm({...loginForm, clave: e.target.value})}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowLoginModal(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Registro */}
      {showRegisterModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Registrar Usuario</h2>
              <button 
                onClick={() => setShowRegisterModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleRegister} className="modal-body">
              <div className="form-group">
                <label>Nombres:</label>
                <input
                  type="text"
                  value={registerForm.nombres}
                  onChange={(e) => setRegisterForm({...registerForm, nombres: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Apellidos:</label>
                <input
                  type="text"
                  value={registerForm.apellidos}
                  onChange={(e) => setRegisterForm({...registerForm, apellidos: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Correo Electrónico:</label>
                <input
                  type="email"
                  value={registerForm.correo}
                  onChange={(e) => setRegisterForm({...registerForm, correo: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contraseña:</label>
                <input
                  type="password"
                  value={registerForm.clave}
                  onChange={(e) => setRegisterForm({...registerForm, clave: e.target.value})}
                  required
                  minLength="6"
                />
              </div>
              <div className="form-group">
                <label>Confirmar Contraseña:</label>
                <input
                  type="password"
                  value={registerForm.confirmarClave}
                  onChange={(e) => setRegisterForm({...registerForm, confirmarClave: e.target.value})}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Registrando...' : 'Registrar'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowRegisterModal(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Editar Usuario</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEdit} className="modal-body">
              <div className="form-group">
                <label>Nombres:</label>
                <input
                  type="text"
                  value={editForm.nombres}
                  onChange={(e) => setEditForm({...editForm, nombres: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Apellidos:</label>
                <input
                  type="text"
                  value={editForm.apellidos}
                  onChange={(e) => setEditForm({...editForm, apellidos: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Correo Electrónico:</label>
                <input
                  type="email"
                  value={editForm.correo}
                  onChange={(e) => setEditForm({...editForm, correo: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nueva Contraseña (opcional):</label>
                <input
                  type="password"
                  value={editForm.clave}
                  onChange={(e) => setEditForm({...editForm, clave: e.target.value})}
                  placeholder="Dejar vacío para mantener la actual"
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={editForm.activo}
                    onChange={(e) => setEditForm({...editForm, activo: e.target.checked})}
                  />
                  Usuario Activo
                </label>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Actualizando...' : 'Actualizar'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalles */}
      {showDetailsModal && usuarioDetalles && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Detalles del Usuario</h2>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-item">
                  <strong>ID:</strong> {usuarioDetalles.id}
                </div>
                <div className="detail-item">
                  <strong>Nombres:</strong> {usuarioDetalles.nombres}
                </div>
                <div className="detail-item">
                  <strong>Apellidos:</strong> {usuarioDetalles.apellidos}
                </div>
                <div className="detail-item">
                  <strong>Correo:</strong> {usuarioDetalles.correo}
                </div>
                <div className="detail-item">
                  <strong>Estado:</strong> 
                  <span className={`status ${usuarioDetalles.activo ? 'active' : 'inactive'}`}>
                    {usuarioDetalles.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="detail-item">
                  <strong>Fecha de Registro:</strong> 
                  {new Date(usuarioDetalles.fechaRegistro).toLocaleString()}
                </div>
                <div className="detail-item">
                  <strong>Rol ID:</strong> {usuarioDetalles.idRol}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="btn btn-secondary"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuarioManager;

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Swal from 'sweetalert2';
import usuariosService from '../../services/usuariosService';
import { API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '../../constants/apiConstants';
import Pagination from '../shared/Pagination';
import './UsuariosTable.scss';

const UsuariosTable = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [nuevo, setNuevo] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    clave: '',
    confirmarClave: '',
    idRol: 3, // Usuario por defecto
    activo: true
  });
  const [editando, setEditando] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [usuarioDetalle, setUsuarioDetalle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [erroresValidacion, setErroresValidacion] = useState({});

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [usuariosPorPagina] = useState(5);

  useEffect(() => {
    cargarUsuarios();
    cargarRoles();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const data = await usuariosService.obtenerTodos();
      setUsuarios(data);
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudieron cargar los usuarios',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarRoles = async () => {
    try {
      const rolesData = await usuariosService.obtenerRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Error al cargar roles:', error);
      // Usar roles por defecto si falla
      setRoles([
        { id: 1, nombreRol: 'Administrador', activo: true },
        { id: 2, nombreRol: 'Asistente', activo: true },
        { id: 3, nombreRol: 'Usuario', activo: true },
        { id: 4, nombreRol: 'Cliente', activo: true }
      ]);
    }
  };

  // Buscar usuarios por término (incluye cédula/documento o ID) usando API
  const buscarUsuarios = async () => {
    if (!busqueda.trim()) {
      await cargarUsuarios();
      return;
    }
    setLoading(true);
    try {
      const resultados = await usuariosService.buscar(busqueda.trim());
      setUsuarios(resultados || []);
      setPaginaActual(1);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de búsqueda',
        text: error.message || 'No se pudo realizar la búsqueda',
        timer: 2500,
        showConfirmButton: false
      });
    } finally {
      setLoading(false);
    }
  };

  const validarFormulario = () => {
    const errores = {};
    
    // Validar nombres
    if (!nuevo.nombres || nuevo.nombres.trim().length < 2) {
      errores.nombres = 'El nombre debe tener al menos 2 caracteres';
    }
    
    // Validar apellidos
    if (!nuevo.apellidos || nuevo.apellidos.trim().length < 2) {
      errores.apellidos = 'Los apellidos deben tener al menos 2 caracteres';
    }
    
    // Validar correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!nuevo.correo || !emailRegex.test(nuevo.correo)) {
      errores.correo = 'Ingrese un correo electrónico válido';
    }
    
    // Validar contraseña solo para nuevos usuarios
    if (!editando) {
      if (!nuevo.clave || nuevo.clave.length < 6) {
        errores.clave = 'La contraseña debe tener al menos 6 caracteres';
      }
      
      if (nuevo.clave !== nuevo.confirmarClave) {
        errores.confirmarClave = 'Las contraseñas no coinciden';
      }
    }
    
    // Validar rol
    if (!nuevo.idRol || nuevo.idRol <= 0) {
      errores.idRol = 'Seleccione un rol válido';
    }
    
    setErroresValidacion(errores);
    return Object.keys(errores).length === 0;
  };

  const usuariosFiltrados = usuarios.filter(usuario =>
    (usuario.nombres || usuario.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (usuario.apellidos || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (usuario.correo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    ((usuario.documento || usuario.cedula || usuario.dni || usuario.ci || '').toString()).toLowerCase().includes(busqueda.toLowerCase()) ||
    (String(usuario.id || '')).includes(busqueda.trim())
  );

  // Paginación
  const indiceUltimoUsuario = paginaActual * usuariosPorPagina;
  const indicePrimerUsuario = indiceUltimoUsuario - usuariosPorPagina;
  const usuariosActuales = usuariosFiltrados.slice(indicePrimerUsuario, indiceUltimoUsuario);
  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const guardarUsuario = async () => {
    // Limpiar errores previos
    setErroresValidacion({});
    
    // Validar formulario
    if (!validarFormulario()) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos inválidos',
        text: 'Por favor, corrija los errores en el formulario',
        timer: 3000,
        showConfirmButton: false
      });
      return;
    }
    
    setLoading(true);
    try {
      // Verificar si el correo ya existe
      const correoExiste = await usuariosService.validarCorreoExistente(
        nuevo.correo, 
        editando ? nuevo.id : null
      );
      
      if (correoExiste.existe) {
        setErroresValidacion({ correo: 'Este correo ya está registrado' });
        Swal.fire({
          icon: 'warning',
          title: 'Correo duplicado',
          text: 'Este correo electrónico ya está registrado',
          timer: 3000,
          showConfirmButton: false
        });
        return;
      }
      
      if (editando) {
        // Actualizar usuario existente
        const usuarioActualizado = await usuariosService.actualizar(nuevo.id, {
          nombres: nuevo.nombres.trim(),
          apellidos: nuevo.apellidos.trim(),
          correo: nuevo.correo.trim(),
          idRol: parseInt(nuevo.idRol),
          activo: nuevo.activo,
          ...(nuevo.clave && { clave: nuevo.clave })
        });
        
        await Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'Usuario actualizado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // Crear nuevo usuario
        const nuevoUsuario = await usuariosService.crear({
          nombres: nuevo.nombres.trim(),
          apellidos: nuevo.apellidos.trim(),
          correo: nuevo.correo.trim(),
          clave: nuevo.clave,
          idRol: parseInt(nuevo.idRol)
        });
        
        await Swal.fire({
          icon: 'success',
          title: '¡Registrado!',
          text: 'Usuario registrado exitosamente',
          timer: 2000,
          showConfirmButton: false
        });
      }
      
      // Recargar usuarios y cerrar modal
      await cargarUsuarios();
      resetearFormulario();
      setDialogOpen(false);
      
    } catch (error) {
      console.error('Error:', error);
      
      // Manejar errores específicos
      let mensajeError = 'Ocurrió un error inesperado';
      
      if (error.message.includes('correo')) {
        mensajeError = 'Error con el correo electrónico';
        setErroresValidacion({ correo: error.message });
      } else if (error.message.includes('contraseña') || error.message.includes('clave')) {
        mensajeError = 'Error con la contraseña';
        setErroresValidacion({ clave: error.message });
      } else if (error.message.includes('nombre')) {
        mensajeError = 'Error con el nombre';
        setErroresValidacion({ nombres: error.message });
      }
      
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || mensajeError,
        timer: 3000,
        showConfirmButton: false
      });
    } finally {
      setLoading(false);
    }
  };

  const eliminarUsuario = async (id) => {
    const usuarioObj = usuarios.find(u => u.id === id);
    const displayName = usuarioObj ? `${usuarioObj.nombres || usuarioObj.nombre} ${(usuarioObj.apellidos || '')}`.trim() : `ID ${id}`;
    // (ID: ${id})
    const result = await Swal.fire({
      title: '¿Eliminar usuario?',
      text: `Se eliminará "${displayName}." Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setDeletingId(id);
      setLoading(true);
      try {
        await usuariosService.eliminar(id);
        
        await Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: `Usuario "${displayName}" (ID: ${id}) eliminado correctamente`,
          timer: 2000,
          showConfirmButton: false
        });
        
        await cargarUsuarios();
      } catch (error) {
        console.error('Error:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || `No se pudo eliminar "${displayName}" (ID: ${id})`,
          timer: 3000,
          showConfirmButton: false
        });
      } finally {
        setDeletingId(null);
        setLoading(false);
      }
    }
  };

  const editarUsuario = (usuario) => {
    if (!usuario.activo) {
      Swal.fire({
        icon: 'info',
        title: 'Usuario inactivo',
        text: 'No puedes editar un registro inactivo. Actívalo primero para continuar.',
        timer: 2200,
        showConfirmButton: false
      });
      return;
    }
    setNuevo({
      id: usuario.id,
      nombres: usuario.nombres || usuario.nombre || '',
      apellidos: usuario.apellidos || '',
      correo: usuario.correo,
      clave: '',
      confirmarClave: '',
      idRol: usuario.idRol || 3,
      activo: usuario.activo
    });
    setEditando(true);
    setErroresValidacion({});
    setDialogOpen(true);
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    setUpdatingId(id);
    setLoading(true);
    try {
      await usuariosService.cambiarEstado(id, nuevoEstado);

      const usuarioObj = usuarios.find(u => u.id === id);
      const displayName = usuarioObj ? `${usuarioObj.nombres || usuarioObj.nombre} ${(usuarioObj.apellidos || '')}`.trim() : `ID ${id}`;
      
      await Swal.fire({
        icon: 'success',
        title: `¡${nuevoEstado ? 'Activado' : 'Desactivado'}!`,
        text: `Usuario "${displayName}" (ID: ${id}) ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`,
        timer: 2000,
        showConfirmButton: false
      });
      
      await cargarUsuarios();
    } catch (error) {
      console.error('Error:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || `No se pudo cambiar el estado de "${id}"`,
        timer: 3000,
        showConfirmButton: false
      });
    } finally {
      setUpdatingId(null);
      setLoading(false);
    }
  };

  const resetearFormulario = () => {
    setNuevo({
      nombres: '',
      apellidos: '',
      correo: '',
      clave: '',
      confirmarClave: '',
      idRol: 3,
      activo: true
    });
    setEditando(false);
    setErroresValidacion({});
  };

  const abrirAgregar = () => {
    resetearFormulario();
    setDialogOpen(true);
  };

  const verDetalles = (usuario) => {
    setUsuarioDetalle(usuario);
  };

  return (
    <div className="usuarios-container">
      <div className="usuarios-header">
        <div className="header-left">
          <h2>USUARIOS <span className="contador-usuarios">({usuariosFiltrados.length})</span></h2>
        </div>
        <div className="header-right">
          <div className="acciones-globales">
            <input
              type="text"
              className="input-busqueda"
              placeholder="Buscar por nombre, correo o cédula..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') buscarUsuarios(); }}
            />
            <button
              className="btn btn-agregar"
              onClick={abrirAgregar}
              disabled={loading}
            >
              Agregar Usuario
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios aquí */}
      <div className="tabla-wrapper">
        <table className="tabla-usuarios">
          <thead>
              <tr>
                <th>ID</th>
                <th>Nombres</th>
                <th>Apellidos</th>
                <th>Correo Electrónico</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
          <tbody>
            {loading && usuarios.length === 0 ? (
              <tr>
                <td colSpan="6" className="sin-resultados">Cargando usuarios...</td>
              </tr>
            ) : usuariosActuales.length === 0 ? (
              <tr>
                <td colSpan="6" className="sin-resultados">
                  {busqueda ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
                </td>
              </tr>
            ) : (
              usuariosActuales.map((usuario) => (
                <tr key={usuario.id} className={!usuario.activo ? 'fila-anulada' : ''}>
                  <td>{usuario.id}</td>
                  <td>{usuario.nombres || usuario.nombre}</td>
                  <td>{usuario.apellidos || ''}</td>
                  <td>{usuario.correo}</td>
                  <td>
                    <button
                      className={`estado ${usuario.activo ? 'activa' : 'anulada'}`}
                      onClick={() => cambiarEstado(usuario.id, !usuario.activo)}
                      title={usuario.activo ? 'Clic para desactivar' : 'Clic para activar'}
                      disabled={loading || updatingId === usuario.id}
                    >
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td>
                    <div className="acciones">
                      <button
                        className="btn-icono btn-detalles"
                        onClick={() => verDetalles(usuario)}
                        title="Ver Detalles"
                        disabled={loading}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#6b7280"/>
                        </svg>
                      </button>
                      <button
                        className="btn-icono btn-editar"
                        onClick={() => editarUsuario(usuario)}
                        title="Editar"
                        disabled={!usuario.activo || loading || updatingId === usuario.id}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#000000"/>
                        </svg>
                      </button>
                      <button
                        className="btn-icono btn-eliminar"
                        onClick={() => eliminarUsuario(usuario.id)}
                        title="Eliminar"
                        aria-label="Eliminar usuario"
                        disabled={!usuario.activo || loading || deletingId === usuario.id}
                        aria-busy={deletingId === usuario.id}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#dc2626"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <Pagination
        currentPage={paginaActual}
        totalPages={totalPaginas}
        onPageChange={cambiarPagina}
        itemsPerPage={usuariosPorPagina}
        totalItems={usuariosFiltrados.length}
        showInfo={true}
      />

      {/* Modal Agregar/Editar Usuario */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content
            className="dialog-content"
            onEscapeKeyDown={() => { resetearFormulario(); setDialogOpen(false); }}
            onInteractOutside={() => { resetearFormulario(); setDialogOpen(false); }}
          >
            <Dialog.Title className="dialog-title">
              {editando ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '8px'}}>
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                  </svg>
                  Editar Usuario
                </>
              ) : 'Formulario de agregar usuario'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="dialog-close-unified">&times;</button>
            </Dialog.Close>

            <div className="formulario-unico">
              <div className="grupo-campo">
                <label>Nombres <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  placeholder="Nombres"
                  value={nuevo.nombres}
                  onChange={(e) =>
                    setNuevo({ ...nuevo, nombres: e.target.value })
                  }
                  className={erroresValidacion.nombres ? 'error' : ''}
                />
                {erroresValidacion.nombres && (
                  <span className="error-mensaje">{erroresValidacion.nombres}</span>
                )}
              </div>

              <div className="grupo-campo">
                <label>Apellidos <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  placeholder="Apellidos"
                  value={nuevo.apellidos}
                  onChange={(e) =>
                    setNuevo({ ...nuevo, apellidos: e.target.value })
                  }
                  className={erroresValidacion.apellidos ? 'error' : ''}
                />
                {erroresValidacion.apellidos && (
                  <span className="error-mensaje">{erroresValidacion.apellidos}</span>
                )}
              </div>

              <div className="grupo-campo">
                <label>Correo Electrónico <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={nuevo.correo}
                  onChange={(e) =>
                    setNuevo({ ...nuevo, correo: e.target.value })
                  }
                  className={erroresValidacion.correo ? 'error' : ''}
                />
                {erroresValidacion.correo && (
                  <span className="error-mensaje">{erroresValidacion.correo}</span>
                )}
              </div>

              <div className="grupo-campo">
                <label>Rol <span style={{ color: 'red' }}>*</span></label>
                <select
                  value={nuevo.idRol}
                  onChange={(e) =>
                    setNuevo({ ...nuevo, idRol: parseInt(e.target.value) })
                  }
                  className={erroresValidacion.idRol ? 'error' : ''}
                >
                  <option value="">Seleccionar rol</option>
                  {roles.map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {rol.nombreRol || rol.nombre}
                    </option>
                  ))}
                </select>
                {erroresValidacion.idRol && (
                  <span className="error-mensaje">{erroresValidacion.idRol}</span>
                )}
              </div>

              {!editando && (
                <div className="grupo-campo">
                  <label>Contraseña <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={nuevo.clave}
                    onChange={(e) =>
                      setNuevo({ ...nuevo, clave: e.target.value })
                    }
                    className={erroresValidacion.clave ? 'error' : ''}
                  />
                  {erroresValidacion.clave && (
                    <span className="error-mensaje">{erroresValidacion.clave}</span>
                  )}
                </div>
              )}
              
              {editando && (
                <div className="grupo-campo">
                  <label>Nueva Contraseña (opcional)</label>
                  <input
                    type="password"
                    placeholder="Nueva contraseña"
                    value={nuevo.clave}
                    onChange={(e) =>
                      setNuevo({ ...nuevo, clave: e.target.value })
                    }
                    className={erroresValidacion.clave ? 'error' : ''}
                  />
                  {erroresValidacion.clave && (
                    <span className="error-mensaje">{erroresValidacion.clave}</span>
                  )}
                  <small>Dejar vacío para mantener la contraseña actual</small>
                </div>
              )}

              {(!editando || nuevo.clave) && (
                <div className="grupo-campo">
                  <label>Confirmar Contraseña <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="password"
                    placeholder="Confirmar contraseña"
                    value={nuevo.confirmarClave}
                    onChange={(e) =>
                      setNuevo({ ...nuevo, confirmarClave: e.target.value })
                    }
                    className={erroresValidacion.confirmarClave ? 'error' : ''}
                  />
                  {erroresValidacion.confirmarClave && (
                    <span className="error-mensaje">{erroresValidacion.confirmarClave}</span>
                  )}
                </div>
              )}

              {/* Campo Estado removido en edición; el estado se maneja desde el botón externo en la tabla */}
            </div>

            <div className="dialog-buttons">
                <button
                  className="btn btn-confirmar"
                  onClick={guardarUsuario}
                  disabled={loading}
                >
                  {loading ? 'Procesando...' : (editando ? 'Actualizar Usuario' : 'Agregar Usuario')}
                </button>
              </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal Ver Detalles */}
      <Dialog.Root
        open={!!usuarioDetalle}
        onOpenChange={() => setUsuarioDetalle(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content
            className="dialog-content dialog-detalles"
            onEscapeKeyDown={() => setUsuarioDetalle(null)}
            onInteractOutside={() => setUsuarioDetalle(null)}
          >
            <Dialog.Close asChild>
              <button className="dialog-close-unified" aria-label="Cerrar">&times;</button>
            </Dialog.Close>
            
            <Dialog.Title className="modal-titulo-base">
              Detalles del Usuario
            </Dialog.Title>
            {usuarioDetalle && (
              <div className="seccion-detalles-base">
                <h3 className="titulo-seccion-base">Información Personal</h3>
                <div className="formulario-dos-columnas-base">
                  <div className="detalle-grupo-base">
                    <label>ID:</label>
                    <span>{usuarioDetalle.id}</span>
                  </div>
                  <div className="detalle-grupo-base">
                    <label>Nombres:</label>
                    <span>{usuarioDetalle.nombres || usuarioDetalle.nombre}</span>
                  </div>
                  <div className="detalle-grupo-base">
                    <label>Apellidos:</label>
                    <span>{usuarioDetalle.apellidos || 'No especificado'}</span>
                  </div>
                  <div className="detalle-grupo-base">
                    <label>Correo:</label>
                    <span>{usuarioDetalle.correo}</span>
                  </div>
                  <div className="detalle-grupo-base">
                    <label>Rol:</label>
                    <span>{usuarioDetalle.nombreRol || `Rol ${usuarioDetalle.idRol}`}</span>
                  </div>
                  <div className="detalle-grupo-base">
                    <label>Contraseña:</label>
                    <span>••••••••</span>
                  </div>
                </div>
              </div>
            )}
            
            {usuarioDetalle && (
              <div className="seccion-detalles-base">
                <h3 className="titulo-seccion-base">Información del Sistema</h3>
                <div className="formulario-dos-columnas-base">
                  <div className="detalle-grupo-base">
                    <label>Estado:</label>
                    <span className={`estado-badge ${usuarioDetalle.activo ? 'activo' : 'inactivo'}`}>
                      {usuarioDetalle.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <div className="detalle-grupo-base">
                    <label>Fecha de Registro:</label>
                    <span>{usuarioDetalle.fechaRegistro || 'No disponible'}</span>
                  </div>
                </div>
              </div>
            )}
            

          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default UsuariosTable;

import { API_BASE_URL, API_ENDPOINTS } from '../constants/apiConstants';
import { getToken as getStoreToken } from '../features/auth/tokenStore';

class UsuariosService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getAuthHeaders(extra = {}) {
    const token = getStoreToken();
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra
    };
  }

  async authFetch(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: this.getAuthHeaders(options.headers || {}),
      credentials: 'include'
    });
  }

  // Validar datos de usuario
  validarDatosUsuario(usuario, esEdicion = false) {
    const errores = [];

    // Validar nombres
    if (!usuario.nombres || usuario.nombres.trim().length < 2) {
      errores.push('El nombre debe tener al menos 2 caracteres');
    }

    // Validar apellidos
    if (!usuario.apellidos || usuario.apellidos.trim().length < 2) {
      errores.push('Los apellidos deben tener al menos 2 caracteres');
    }

    // Validar correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!usuario.correo || !emailRegex.test(usuario.correo)) {
      errores.push('Ingresa un correo electrónico válido');
    }

    // Validar contraseña (solo para usuarios nuevos o si se proporciona)
    if (!esEdicion && (!usuario.clave || usuario.clave.length < 6)) {
      errores.push('La contraseña debe tener al menos 6 caracteres');
    } else if (esEdicion && usuario.clave && usuario.clave.length < 6) {
      errores.push('La contraseña debe tener al menos 6 caracteres');
    }

    // Validar rol
    if (!usuario.idRol || usuario.idRol <= 0) {
      errores.push('Debe seleccionar un rol válido');
    }

    return errores;
  }

  // Obtener todos los usuarios
  async obtenerTodos() {
    try {
      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.USUARIOS.GET_ALL}`, { credentials: 'include' });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
      
      const usuarios = await response.json();
      return usuarios || [];
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw new Error('No se pudieron cargar los usuarios. Verifica tu conexión.');
    }
  }

  // Obtener usuario por ID
  async obtenerPorId(id) {
    try {
      if (!id || id <= 0) {
        throw new Error('ID de usuario inválido');
      }

      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.USUARIOS.GET_BY_ID.replace(':id', id)}`, { credentials: 'include' });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Usuario no encontrado');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      throw error;
    }
  }

  // Crear nuevo usuario
  async crear(usuario) {
    try {
      // Validar datos antes de enviar
      const errores = this.validarDatosUsuario(usuario, false);
      if (errores.length > 0) {
        throw new Error(errores.join(', '));
      }

      // Preparar datos para la API
      const usuarioData = {
        nombres: usuario.nombres.trim(),
        apellidos: usuario.apellidos.trim(),
        correo: usuario.correo.toLowerCase().trim(),
        clave: usuario.clave,
        idRol: parseInt(usuario.idRol),
        activo: usuario.activo !== undefined ? usuario.activo : true
      };

      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.USUARIOS.CREATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(usuarioData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400) {
          throw new Error(errorData.message || 'Datos inválidos');
        }
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  }

  // Registrar nuevo usuario
  async registrar(usuario) {
    try {
      console.log('=== DEBUG REGISTRO ===');
      console.log('Datos enviados:', usuario);
      
      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.AUTH.REGISTER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(usuario)
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('Error data:', errorData);
        throw new Error(errorData.mensaje || errorData.message || `Error HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Response data:', result);
      return result;
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      throw error;
    }
  }

  // Login de usuario
  async login(credenciales) {
    try {
      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(credenciales)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al hacer login:', error);
      throw error;
    }
  }

  // Actualizar usuario
  async actualizar(id, usuario) {
    try {
      if (!id || id <= 0) {
        throw new Error('ID de usuario inválido');
      }

      // Validar datos antes de enviar
      const errores = this.validarDatosUsuario(usuario, true);
      if (errores.length > 0) {
        throw new Error(errores.join(', '));
      }

      // Preparar datos para la API
      const usuarioData = {
        id: parseInt(id),
        nombres: usuario.nombres.trim(),
        apellidos: usuario.apellidos.trim(),
        correo: usuario.correo.toLowerCase().trim(),
        idRol: parseInt(usuario.idRol),
        activo: usuario.activo !== undefined ? usuario.activo : true
      };

      // Solo incluir la contraseña si se proporciona
      if (usuario.clave && usuario.clave.trim()) {
        usuarioData.clave = usuario.clave;
      }

      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.USUARIOS.UPDATE.replace(':id', id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(usuarioData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          throw new Error('Usuario no encontrado');
        }
        if (response.status === 400) {
          throw new Error(errorData.message || 'Datos inválidos');
        }
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  }

  // Actualiza la imagen del usuario autenticado
  async actualizarMiImagen(imagenUrl) {
    try {
      if (!imagenUrl || typeof imagenUrl !== 'string') {
        throw new Error('URL de imagen inválida');
      }

      const response = await this.authFetch(`${API_BASE_URL}${API_ENDPOINTS.USUARIOS_EXTRA.MI_IMAGEN}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ ImagenUrl: imagenUrl })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.mensaje || 'No se pudo actualizar la imagen');
      }
      return data;
    } catch (error) {
      console.error('Error al actualizar imagen del usuario:', error);
      throw error;
    }
  }

  // Eliminar usuario (soft delete)
  async eliminar(id) {
    try {
      if (!id || id <= 0) {
        throw new Error('ID de usuario inválido');
      }

      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.USUARIOS.DELETE.replace(':id', id)}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          throw new Error('Usuario no encontrado');
        }
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw error;
    }
  }

  // Buscar usuarios
  async buscar(termino) {
    try {
      if (!termino || termino.trim().length < 2) {
        throw new Error('El término de búsqueda debe tener al menos 2 caracteres');
      }

      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.USUARIOS.SEARCH.replace(':termino', encodeURIComponent(termino.trim()))}`, { credentials: 'include' });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
      
      const usuarios = await response.json();
      return usuarios || [];
    } catch (error) {
      console.error('Error al buscar usuarios:', error);
      throw error;
    }
  }

  // Cambiar estado del usuario
  async cambiarEstado(id, activo) {
    try {
      if (!id || id <= 0) {
        throw new Error('ID de usuario inválido');
      }

      // Obtener datos actuales del usuario
      const usuarioActual = await this.obtenerPorId(id);
      
      // Actualizar solo el estado
      const usuarioData = {
        id: parseInt(id),
        nombres: usuarioActual.nombres,
        apellidos: usuarioActual.apellidos,
        correo: usuarioActual.correo,
        idRol: usuarioActual.idRol,
        activo: Boolean(activo)
      };

      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.USUARIOS.UPDATE.replace(':id', id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(usuarioData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          throw new Error('Usuario no encontrado');
        }
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      throw error;
    }
  }

  // Validar si el correo ya existe (método mejorado)
  async validarCorreoExistente(correo, idUsuarioExcluir = null) {
    try {
      if (!correo || !correo.trim()) {
        throw new Error('Correo requerido para validación');
      }

      const usuarios = await this.obtenerTodos();
      const correoNormalizado = correo.toLowerCase().trim();
      
      const usuarioExistente = usuarios.find(u => 
        u.correo.toLowerCase() === correoNormalizado && 
        (!idUsuarioExcluir || u.id !== parseInt(idUsuarioExcluir))
      );

      return {
        existe: !!usuarioExistente,
        usuario: usuarioExistente || null
      };
    } catch (error) {
      console.error('Error al validar correo:', error);
      throw error;
    }
  }

  // Obtener roles disponibles (método auxiliar)
  async obtenerRoles() {
    try {
      const response = await this.authFetch(`${this.baseURL}/api/roles`, { method: 'GET' });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let message = errorData.message || `Error HTTP: ${response.status}`;
        if (response.status === 401) message = 'No autorizado (401). Inicia sesión o tu sesión expiró.';
        else if (response.status === 403) message = 'Acceso denegado (403). No tienes permisos suficientes.';
        const err = new Error(message);
        err.status = response.status;
        throw err;
      }
      
      const roles = await response.json();
      return roles.filter(rol => rol.activo) || [];
    } catch (error) {
      console.error('Error al obtener roles:', error);
      // Retornar roles por defecto si falla
        return [
          { id: 1, nombreRol: 'Administrador', activo: true },
          { id: 2, nombreRol: 'Asistente', activo: true },
          { id: 3, nombreRol: 'Usuario', activo: true },
          { id: 4, nombreRol: 'Cliente', activo: true }
        ];
    }
  }
}

export default new UsuariosService();

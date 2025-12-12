import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import * as Dialog from '@radix-ui/react-dialog';
import { API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '../../constants/apiConstants';
import { getToken as getStoreToken } from '../../features/auth/tokenStore';
import Pagination from '../shared/Pagination';
import './ClientesTable.scss';
import clientesService from '../../services/clientesService';

const ClientesTable = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    apellido: '',
    documento: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    activo: true
  });
  
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoCliente, setEditandoCliente] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [erroresCliente, setErroresCliente] = useState({ nombre: '', apellido: '', email: '', documento: '', telefono: '', codigoPostal: '' });
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  
  // Estados para verificación de documento
  const [docCheckStatus, setDocCheckStatus] = useState('unknown'); // unknown | available | exists | error
  const [docCheckLoading, setDocCheckLoading] = useState(false);
  const [docCheckMessage, setDocCheckMessage] = useState('');
  
  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [clientesPorPagina] = useState(5); // Cambiado a 5 registros por página
  
  

  // Función para cargar clientes desde la API
  const cargarClientes = async () => {
    try {
      setLoading(true);
      const data = await clientesService.obtenerClientes();
      setClientes(data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor',
        timer: 3000,
        showConfirmButton: false
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const validarCliente = (cliente) => {
    const campos = ['nombre', 'apellido', 'email', 'documento', 'telefono', 'codigoPostal'];
    return campos.every((campo) => cliente[campo]?.trim() !== '');
  };

  // Validación de documento (opcional): solo números y longitud razonable
  const validarDocumento = (documento) => {
    const doc = (documento || '').trim();
    const soloDigitos = /^\d+$/;
    if (!doc) return { valid: false, message: 'El documento debe contener 10 números.' };
    if (!soloDigitos.test(doc)) return { valid: false, message: 'El documento debe contener solo números.' };
    if (doc.length !== 10) return { valid: false, message: 'El documento debe tener exactamente 10 dígitos.' };
    return { valid: true };
  };

  const validarTelefono = (telefono) => {
    const tel = (telefono || '').trim();
    const soloDigitos = /^\d+$/;
    if (!tel) return { valid: false, message: 'El teléfono debe contener 10 números.' };
    if (!soloDigitos.test(tel)) return { valid: false, message: 'El teléfono debe contener solo números.' };
    if (tel.length !== 10) return { valid: false, message: 'El teléfono debe tener exactamente 10 dígitos.' };
    return { valid: true };
  };

  const validarCodigoPostal = (codigo) => {
    const cp = (codigo || '').trim();
    const soloDigitos = /^\d+$/;
    if (!cp) return { valid: false, message: 'El código postal debe contener 10 números.' };
    if (!soloDigitos.test(cp)) return { valid: false, message: 'El código postal debe contener solo números.' };
    if (cp.length !== 10) return { valid: false, message: 'El código postal debe tener exactamente 10 dígitos.' };
    return { valid: true };
  };

  // Manejador de cambio para campos del nuevo cliente, resetea verificación cuando cambia documento
  const manejarCambioNuevoCliente = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (name === 'documento') {
      val = value.replace(/\D/g, '').slice(0, 10);
      setDocCheckStatus('unknown');
      setDocCheckMessage('');
      const { valid, message } = validarDocumento(val);
      setErroresCliente(prev => ({ ...prev, documento: valid ? '' : message }));
    }
    setNuevoCliente(prev => ({ ...prev, [name]: val }));
  };

  // Auto-verificar documento al escribir (con pequeño debounce)
  useEffect(() => {
    const doc = (nuevoCliente.documento || '').trim();
    // Si se limpia el documento, resetear estado y salir
    if (!doc) {
      setDocCheckStatus('unknown');
      setDocCheckMessage('');
      return;
    }

    const { valid, message } = validarDocumento(doc);
    if (!valid) {
      setDocCheckStatus('error');
      setDocCheckMessage(message);
      return;
    }

    const t = setTimeout(() => {
      verificarDocumentoAuto(doc);
    }, 400);
    return () => clearTimeout(t);
  }, [nuevoCliente.documento]);

  // Verificación automática: si existe, cargar datos y pasar a edición; si no, mostrar mensaje de no encontrado
  const verificarDocumentoAuto = async (doc) => {
    setDocCheckLoading(true);
    const extraerLista = (res) => {
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.value)) return res.value;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    };
    const esMismoDoc = (c, d) => {
      const v = String((c?.documento ?? c?.Documento ?? '')).trim();
      return v && v === d;
    };
    try {
      const resultados = await clientesService.buscar(doc);
      let lista = extraerLista(resultados);
      let clienteEncontrado = lista.find(c => esMismoDoc(c, doc));

      // Si no hubo coincidencia directa, intentar con todos los clientes como fallback
      if (!clienteEncontrado) {
        const todos = await clientesService.obtenerClientes().catch(() => []);
        const listaTodos = extraerLista(todos);
        clienteEncontrado = listaTodos.find(c => esMismoDoc(c, doc));
      }

      if (clienteEncontrado) {
        setDocCheckStatus('exists');
        const nombre = `${clienteEncontrado.nombre || ''} ${clienteEncontrado.apellido || ''}`.trim();
        setDocCheckMessage(`Documento ya registrado${nombre ? `: ${nombre}` : ''}`);

        // Cargar datos del cliente y bloquear registro (entrar en modo edición)
        setNuevoCliente({
          nombre: clienteEncontrado?.nombre || '',
          apellido: clienteEncontrado?.apellido || '',
          documento: (clienteEncontrado?.documento ?? clienteEncontrado?.Documento) || doc,
          email: clienteEncontrado?.email || '',
          telefono: clienteEncontrado?.telefono || '',
          direccion: clienteEncontrado?.direccion || '',
          ciudad: clienteEncontrado?.ciudad || '',
          codigoPostal: clienteEncontrado?.codigoPostal || '',
          activo: clienteEncontrado?.activo !== false
        });
        setEditandoCliente(clienteEncontrado?.id ?? clienteEncontrado?.Id);
      } else {
        setDocCheckStatus('available');
        setDocCheckMessage('No se encuentra ningún registro');
        // Asegurar que no estamos en modo edición si no existe
        setEditandoCliente(null);
      }
    } catch (error) {
      console.error('Error al verificar documento automáticamente:', error);
      setDocCheckStatus('error');
      setDocCheckMessage('No se pudo verificar, intenta nuevamente');
    } finally {
      setDocCheckLoading(false);
    }
  };

  // Verificar existencia de documento/cédula
  const verificarDocumento = async () => {
    const doc = (nuevoCliente.documento || '').trim();
    if (!doc) {
      setDocCheckStatus('error');
      setDocCheckMessage('Ingresa un documento para verificar');
      return;
    }
    setDocCheckLoading(true);
    try {
      const extraerLista = (res) => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.value)) return res.value;
        if (res && Array.isArray(res.data)) return res.data;
        return [];
      };
      const esMismoDoc = (c, d) => {
        const v = String((c?.documento ?? c?.Documento ?? '')).trim();
        return v && v === d;
      };

      const resultados = await clientesService.buscar(doc);
      let lista = extraerLista(resultados);
      let clienteEncontrado = lista.find(c => esMismoDoc(c, doc));

      if (!clienteEncontrado) {
        const todos = await clientesService.obtenerClientes().catch(() => []);
        const listaTodos = extraerLista(todos);
        clienteEncontrado = listaTodos.find(c => esMismoDoc(c, doc));
      }

      if (clienteEncontrado) {
        setDocCheckStatus('exists');
        const nombre = `${clienteEncontrado.nombre || ''} ${clienteEncontrado.apellido || ''}`.trim();
        setDocCheckMessage(`Documento ya registrado${nombre ? `: ${nombre}` : ''}`);
        // Cargar datos y entrar en modo edición también en verificación manual
        setNuevoCliente({
          nombre: clienteEncontrado?.nombre || '',
          apellido: clienteEncontrado?.apellido || '',
          documento: (clienteEncontrado?.documento ?? clienteEncontrado?.Documento) || doc,
          email: clienteEncontrado?.email || '',
          telefono: clienteEncontrado?.telefono || '',
          direccion: clienteEncontrado?.direccion || '',
          ciudad: clienteEncontrado?.ciudad || '',
          codigoPostal: clienteEncontrado?.codigoPostal || '',
          activo: clienteEncontrado?.activo !== false
        });
        setEditandoCliente(clienteEncontrado?.id ?? clienteEncontrado?.Id);
      } else {
        setDocCheckStatus('available');
        setDocCheckMessage('No se encuentra ningún registro');
        setEditandoCliente(null);
      }
    } catch (error) {
      console.error('Error al verificar documento:', error);
      setDocCheckStatus('error');
      setDocCheckMessage('No se pudo verificar, intenta nuevamente');
    } finally {
      setDocCheckLoading(false);
    }
  };

  const agregarCliente = async () => {
    if (!validarCliente(nuevoCliente)) {
      return Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Completa todos los campos requeridos (Nombre, Apellido, Email).',
        timer: 2000,
        showConfirmButton: false
      });
    }

    const docVal = validarDocumento(nuevoCliente.documento);
    if (!docVal.valid) {
      return Swal.fire({
        icon: 'warning',
        title: 'Documento inválido',
        text: docVal.message,
        timer: 2500,
        showConfirmButton: false
      });
    }
    const telVal = validarTelefono(nuevoCliente.telefono);
    if (!telVal.valid) {
      return Swal.fire({
        icon: 'warning',
        title: 'Teléfono inválido',
        text: telVal.message,
        timer: 2500,
        showConfirmButton: false
      });
    }
    const cpVal = validarCodigoPostal(nuevoCliente.codigoPostal);
    if (!cpVal.valid) {
      return Swal.fire({
        icon: 'warning',
        title: 'Código postal inválido',
        text: cpVal.message,
        timer: 2500,
        showConfirmButton: false
      });
    }

    // Bloquear creación si el documento ya existe
    if (docCheckStatus === 'exists') {
      return Swal.fire({
        icon: 'error',
        title: 'Documento registrado',
        text: 'El documento ya existe. Verifica antes de guardar.',
        timer: 2500,
        showConfirmButton: false
      });
    }

    try {
      const bearerToken = getStoreToken();
      const headersWithAuth = bearerToken
        ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${bearerToken}` }
        : { ...DEFAULT_HEADERS };
      const payload = {
        nombre: (nuevoCliente.nombre || '').trim(),
        apellido: (nuevoCliente.apellido || '').trim(),
        email: (nuevoCliente.email || '').trim().toLowerCase(),
        telefono: (nuevoCliente.telefono || '').trim(),
        direccion: (nuevoCliente.direccion || '').trim(),
        ciudad: (nuevoCliente.ciudad || '').trim(),
        documento: (nuevoCliente.documento || '').trim(),
        codigoPostal: (nuevoCliente.codigoPostal || '').trim()
      };
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CLIENTES.CREATE), {
        method: 'POST',
        headers: headersWithAuth,
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const clienteCreado = await response.json();
        setClientes(prev => [clienteCreado, ...prev]);
        await cargarClientes();
        setBusqueda('');
        setPaginaActual(1);
        Swal.fire({
          icon: 'success',
          title: 'Cliente agregado',
          text: `Cliente agregado correctamente: ${(nuevoCliente.nombre || '').trim()} ${(nuevoCliente.apellido || '').trim()} (${(nuevoCliente.documento || '').trim()})`,
          timer: 2000,
          showConfirmButton: false
        });
        resetFormulario();
        setMostrarFormulario(false);
      } else {
        let errorMsg = 'No se pudo crear el cliente.';
        try {
          const errJson = await response.json();
          errorMsg = errJson?.message || errorMsg;
        } catch {
          const errorData = await response.text();
          console.error('Error al crear cliente:', errorData);
        }
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMsg.includes('email') ? errorMsg : `${errorMsg} Verifique que el email no esté duplicado.`,
          timer: 3000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error al crear cliente:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor',
        timer: 3000,
        showConfirmButton: false
      });
    }
  };

  const guardarEdicion = async () => {
    if (!validarCliente(nuevoCliente)) {
      return Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Completa todos los campos requeridos (Nombre, Apellido, Email).',
        timer: 2000,
        showConfirmButton: false
      });
    }

    const docVal = validarDocumento(nuevoCliente.documento);
    if (!docVal.valid) {
      return Swal.fire({
        icon: 'warning',
        title: 'Documento inválido',
        text: docVal.message,
        timer: 2500,
        showConfirmButton: false
      });
    }
    const telVal = validarTelefono(nuevoCliente.telefono);
    if (!telVal.valid) {
      return Swal.fire({
        icon: 'warning',
        title: 'Teléfono inválido',
        text: telVal.message,
        timer: 2500,
        showConfirmButton: false
      });
    }
    const cpVal = validarCodigoPostal(nuevoCliente.codigoPostal);
    if (!cpVal.valid) {
      return Swal.fire({
        icon: 'warning',
        title: 'Código postal inválido',
        text: cpVal.message,
        timer: 2500,
        showConfirmButton: false
      });
    }

    try {
      const bearerToken = getStoreToken();
      const headersWithAuth = bearerToken
        ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${bearerToken}` }
        : { ...DEFAULT_HEADERS };
      const payload = {
        ...nuevoCliente,
        id: editandoCliente,
        nombre: (nuevoCliente.nombre || '').trim(),
        apellido: (nuevoCliente.apellido || '').trim(),
        email: (nuevoCliente.email || '').trim().toLowerCase(),
        telefono: (nuevoCliente.telefono || '').trim(),
        direccion: (nuevoCliente.direccion || '').trim(),
        ciudad: (nuevoCliente.ciudad || '').trim(),
        documento: (nuevoCliente.documento || '').trim(),
        codigoPostal: (nuevoCliente.codigoPostal || '').trim()
      };
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CLIENTES.UPDATE.replace(':id', editandoCliente)), {
        method: 'PUT',
        headers: headersWithAuth,
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Recargar la lista de clientes
        await cargarClientes();
        Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'Cliente actualizado correctamente.',
          timer: 2000,
          showConfirmButton: false
        });
        resetFormulario();
        setMostrarFormulario(false);
      } else {
        let errorMsg = response.status === 401
          ? 'No autorizado. Inicie sesión nuevamente.'
          : 'No se pudo actualizar el cliente.';
        try {
          const errJson = await response.json();
          errorMsg = errJson?.message || errorMsg;
        } catch {
          const errorData = await response.text();
          console.error('Error al actualizar cliente:', errorData);
        }
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMsg.includes('email') ? errorMsg : `${errorMsg} Verifique que el email no esté duplicado.`,
          timer: 3000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor',
        timer: 3000,
        showConfirmButton: false
      });
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    updatingId && setUpdatingId(null);
    setUpdatingId(id);
    try {
      await clientesService.cambiarEstadoCliente(id, nuevoEstado);

      const cliente = clientes.find(c => c.id === id);
      const displayName = cliente ? `${cliente.nombre} ${cliente.apellido}`.trim() : `ID ${id}`;

      Swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        text: `Cliente ${displayName} (ID ${id}) ahora está ${nuevoEstado ? 'Activo' : 'Inactivo'}.`,
        timer: 2000,
        showConfirmButton: false
      });

      // Recargar lista para reflejar cambios de servidor
      await cargarClientes();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo cambiar el estado del cliente (ID ${id}).`,
        timer: 3000,
        showConfirmButton: false
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const editarCliente = (cliente) => {
    if (!cliente.activo) {
      Swal.fire({
        icon: 'info',
        title: 'Cliente inactivo',
        text: 'No puedes editar un registro inactivo. Actívalo primero para continuar.',
        timer: 2200,
        showConfirmButton: false
      });
      return;
    }
    setNuevoCliente({
      nombre: cliente.nombre || '',
      apellido: cliente.apellido || '',
      documento: cliente.documento || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || '',
      codigoPostal: cliente.codigoPostal || '',
      activo: cliente.activo
    });
    setEditandoCliente(cliente.id);
    setMostrarFormulario(true);
  };

  const eliminarCliente = async (id) => {
    const cliente = clientes.find(c => c.id === id);
    const result = await Swal.fire({
      title: `¿Eliminar cliente ${cliente?.nombre} ${cliente?.apellido} (ID ${id})?`,
      text: 'Esta acción no se puede deshacer',
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
        // Usar el servicio con cookies HttpOnly
        const res = await clientesService.eliminarCliente(id);
        await cargarClientes();
        const msg = (res && res.message) ? res.message : `Se eliminó correctamente: ${cliente?.nombre} ${cliente?.apellido} (ID ${id}).`;
        Swal.fire({
          icon: 'success',
          title: 'Cliente eliminado',
          text: msg,
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: `${error?.message?.includes('401') ? 'No autorizado. Inicia sesión nuevamente.' : 'No se pudo eliminar el cliente (ID ' + id + ').'}`,
          timer: 3000,
          showConfirmButton: false
        });
      } finally {
        setDeletingId(null);
        setLoading(false);
      }
    }
  };

  

  const resetFormulario = () => {
    setNuevoCliente({
      nombre: '',
      apellido: '',
      documento: '',
      email: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      codigoPostal: '',
      activo: true
    });
    setEditandoCliente(null);
  };

  const verDetalles = (cliente) => {
    setClienteSeleccionado(cliente);
    setMostrarDetalles(true);
  };



  // Filtrar clientes
  const clientesFiltrados = clientes.filter((cliente) => {
    const cumpleBusqueda = busqueda === '' || 
      cliente.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      cliente.apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
      cliente.documento?.toLowerCase().includes(busqueda.toLowerCase());

    return cumpleBusqueda;
  });

  // Paginación
  const indiceUltimoCliente = paginaActual * clientesPorPagina;
  const indicePrimerCliente = indiceUltimoCliente - clientesPorPagina;
  const clientesActuales = clientesFiltrados.slice(indicePrimerCliente, indiceUltimoCliente);
  const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  if (loading) {
    return (
      <div className="clientes-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="clientes-container">
      <div className="clientes-header">
        <div className="header-left">
          <h2>
            Gestión de Clientes
            <span className="contador-clientes">{clientesFiltrados.length}</span>
          </h2>
        </div>

        <div className="header-right">
          {/* Filtros de fecha eliminados */}
          <div className="acciones-globales">
            <div className="barra-busqueda">
              <input
                type="text"
                placeholder="Buscar por nombre, apellido, email o documento..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="input-busqueda"
              />
            </div>
            <button className="btn-agregar" onClick={() => { resetFormulario(); setMostrarFormulario(true); }}>
              Agregar Cliente
            </button>
          </div>
        </div>
      </div>

      {/* Modal para agregar/editar cliente */}
      <Dialog.Root open={mostrarFormulario} onOpenChange={setMostrarFormulario}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content" aria-describedby="dialog-desc-clientes">
            <Dialog.Close asChild>
              <button className="dialog-close-unified" aria-label="Cerrar">×</button>
            </Dialog.Close>
            <Dialog.Title className="dialog-title">
              {editandoCliente ? 'Editar Cliente' : 'Formulario de agregar cliente'}
            </Dialog.Title>
            <p id="dialog-desc-clientes" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
              Completa los campos para crear o editar un cliente.
            </p>

            <div className="formulario-unico">
              {/* Documento primero */}
              <div className="grupo-campo">
                <label>Documento</label>
                <div className="documento-verificacion">
                  <input
                    type="text"
                    id="documento"
                    name="documento"
                    value={nuevoCliente.documento}
                    onChange={manejarCambioNuevoCliente}
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Ingrese el documento"
                  />
                </div>
                {erroresCliente.documento && (<span className="error-mensaje">{erroresCliente.documento}</span>)}
                {docCheckStatus !== 'unknown' && (
                  <div className="doc-indicator-wrapper">
                    <span className={`doc-indicator ${docCheckStatus === 'exists' ? 'existe' : docCheckStatus === 'available' ? 'disponible' : 'error'}`}>
                      {docCheckMessage}
                    </span>
                  </div>
                )}
              </div>

              <div className="grupo-campo">
                <label>Nombre <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  value={nuevoCliente.nombre}
                  className={erroresCliente.nombre ? 'error' : ''}
                  onChange={e => {
                    const v = e.target.value;
                    setNuevoCliente({ ...nuevoCliente, nombre: v });
                    setErroresCliente(prev => ({ ...prev, nombre: v.trim() ? '' : 'El nombre es requerido.' }));
                  }}
                  placeholder="Ingrese el nombre"
                />
                {erroresCliente.nombre && (<span className="error-mensaje">{erroresCliente.nombre}</span>)}
              </div>

              <div className="grupo-campo">
                <label>Apellido <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  value={nuevoCliente.apellido}
                  className={erroresCliente.apellido ? 'error' : ''}
                  onChange={e => {
                    const v = e.target.value;
                    setNuevoCliente({ ...nuevoCliente, apellido: v });
                    setErroresCliente(prev => ({ ...prev, apellido: v.trim() ? '' : 'El apellido es requerido.' }));
                  }}
                  placeholder="Ingrese el apellido"
                />
                {erroresCliente.apellido && (<span className="error-mensaje">{erroresCliente.apellido}</span>)}
              </div>

              <div className="grupo-campo">
                <label>Email <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="email"
                  value={nuevoCliente.email}
                  className={erroresCliente.email ? 'error' : ''}
                  onChange={e => {
                    const v = e.target.value;
                    setNuevoCliente({ ...nuevoCliente, email: v });
                    setErroresCliente(prev => ({ ...prev, email: v.trim() ? '' : 'El email es requerido.' }));
                  }}
                  placeholder="Ingrese el email"
                />
                {erroresCliente.email && (<span className="error-mensaje">{erroresCliente.email}</span>)}
              </div>

              <div className="grupo-campo">
                <label>Teléfono</label>
                <input
                  type="text"
                  value={nuevoCliente.telefono}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setNuevoCliente({ ...nuevoCliente, telefono: v });
                    const { valid, message } = validarTelefono(v);
                    setErroresCliente(prev => ({ ...prev, telefono: valid ? '' : message }));
                  }}
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Ingrese el teléfono"
                />
                {erroresCliente.telefono && (<span className="error-mensaje">{erroresCliente.telefono}</span>)}
              </div>

              <div className="grupo-campo">
                <label>Dirección</label>
                <input
                  type="text"
                  value={nuevoCliente.direccion}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
                  placeholder="Ingrese la dirección"
                />
              </div>

              <div className="grupo-campo">
                <label>Ciudad</label>
                <input
                  type="text"
                  value={nuevoCliente.ciudad}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, ciudad: e.target.value })}
                  placeholder="Ingrese la ciudad"
                />
              </div>

              <div className="grupo-campo">
                <label>Código Postal</label>
                <input
                  type="text"
                  value={nuevoCliente.codigoPostal}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setNuevoCliente({ ...nuevoCliente, codigoPostal: v });
                    const { valid, message } = validarCodigoPostal(v);
                    setErroresCliente(prev => ({ ...prev, codigoPostal: valid ? '' : message }));
                  }}
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Ingrese el código postal"
                />
                {erroresCliente.codigoPostal && (<span className="error-mensaje">{erroresCliente.codigoPostal}</span>)}
              </div>

              {/* Campo Estado eliminado en edición, se gestiona solo desde el botón externo en la tabla */}
            </div>

            <div className="dialog-buttons">
              <button
                className="btn btn-confirmar"
                onClick={editandoCliente ? guardarEdicion : agregarCliente}
                disabled={!editandoCliente && docCheckStatus === 'exists'}
              >
                {editandoCliente ? 'Actualizar Cliente' : 'Agregar Cliente'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="tabla-wrapper">
        <table className="tabla-clientes">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Ciudad</th>
              <th>Fecha Registro</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesActuales.length > 0 ? (
              clientesActuales.map((c) => (
                <tr key={c.id} className={!c.activo ? 'fila-anulada' : ''}>
                  <td>{c.documento || ''}</td>
                  <td>{c.nombre}</td>
                  <td>{c.apellido}</td>
                  <td>{c.email}</td>
                  <td>{c.telefono || ''}</td>
                  <td>{c.ciudad || ''}</td>
                  <td>{new Date(c.fechaRegistro).toLocaleDateString('es-ES')}</td>
                  <td>
                    <button 
                      className={`estado ${c.activo ? 'activa' : 'anulada'}`}
                      onClick={() => cambiarEstado(c.id, !c.activo)}
                      title={c.activo ? 'Clic para desactivar' : 'Clic para activar'}
                      disabled={loading || updatingId === c.id}
                    >
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="acciones">
                    <button 
                      onClick={() => verDetalles(c)} 
                      className="btn-icono btn-detalles" 
                      title="Ver Detalles"
                      disabled={loading}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#6b7280"/>
                      </svg>
                    </button>

                    <button 
                      onClick={() => editarCliente(c)} 
                      className="btn-icono btn-editar" 
                      title="Editar"
                      disabled={loading || !c.activo || updatingId === c.id}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="#6b7280"/>
                        <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="#6b7280"/>
                      </svg>
                    </button>

                    <button 
                      onClick={() => eliminarCliente(c.id)} 
                      className="btn-icono btn-eliminar" 
                      title="Eliminar"
                      disabled={loading || !c.activo || deletingId === c.id}
                      aria-busy={deletingId === c.id}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#dc2626"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                  No se encontraron clientes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <Pagination
        currentPage={paginaActual}
        totalPages={totalPaginas}
        onPageChange={cambiarPagina}
        itemsPerPage={clientesPorPagina}
        totalItems={clientesFiltrados.length}
        showInfo={true}
      />

      {/* Modal de detalles */}
      <Dialog.Root open={mostrarDetalles} onOpenChange={setMostrarDetalles}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content dialog-detalles">
            <Dialog.Close asChild>
              <button
                className="btn-cerrar-x"
                aria-label="Cerrar"
              >
                ×
              </button>
            </Dialog.Close>

            {clienteSeleccionado && (
              <>
                <div className="seccion-detalles-base">
                  <h3 className="titulo-seccion-base">Información Personal</h3>
                  <div className="formulario-dos-columnas-base">
                    <div className="detalle-grupo-base">
                      <label>Nombre Completo:</label>
                      <span>{clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</span>
                    </div>
                    <div className="detalle-grupo-base">
                      <label>Documento:</label>
                      <span>{clienteSeleccionado.documento || 'No especificado'}</span>
                    </div>
                    <div className="detalle-grupo-base">
                      <label>Email:</label>
                      <span>{clienteSeleccionado.email}</span>
                    </div>
                    <div className="detalle-grupo-base">
                      <label>Teléfono:</label>
                      <span>{clienteSeleccionado.telefono || 'No especificado'}</span>
                    </div>
                  </div>
                </div>

                <div className="seccion-detalles-base">
                  <h3 className="titulo-seccion-base">Información de Ubicación</h3>
                  <div className="formulario-dos-columnas-base">
                    <div className="detalle-grupo-base">
                      <label>Dirección:</label>
                      <span>{clienteSeleccionado.direccion || 'No especificada'}</span>
                    </div>
                    <div className="detalle-grupo-base">
                      <label>Ciudad:</label>
                      <span>{clienteSeleccionado.ciudad || 'No especificada'}</span>
                    </div>
                    <div className="detalle-grupo-base">
                      <label>Código Postal:</label>
                      <span>{clienteSeleccionado.codigoPostal || 'No especificado'}</span>
                    </div>
                  </div>
                </div>

                <div className="seccion-detalles-base">
                  <h3 className="titulo-seccion-base">Información del Sistema</h3>
                  <div className="formulario-dos-columnas-base">
                    <div className="detalle-grupo-base">
                      <label>Fecha de Registro:</label>
                      <span>{new Date(clienteSeleccionado.fechaRegistro).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="detalle-grupo-base">
                      <label>Estado:</label>
                      <span className={`estado-badge ${clienteSeleccionado.activo ? 'activo' : 'inactivo'}`}>
                        {clienteSeleccionado.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default ClientesTable;

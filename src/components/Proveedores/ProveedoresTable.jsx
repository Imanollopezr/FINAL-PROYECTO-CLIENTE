import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import Swal from 'sweetalert2';
import * as Dialog from '@radix-ui/react-dialog';
import { API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '../../constants/apiConstants';
import proveedoresService from '../../services/proveedoresService';
import Pagination from '../shared/Pagination';
import AlertService from '../shared/AlertService';
import { normalizeText } from '../../shared/utils/textUtils';

import './ProveedoresTable.scss';

const ProveedoresTable = () => {
  const [proveedores, setProveedores] = useState([]);
  const [nuevoProveedor, setNuevoProveedor] = useState({
    empresa: '',
    nombre: '',
    contacto: '',
    celular: '',
    correo: '',
    direccion: '',
    ciudad: '',
    activo: true
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoProveedor, setEditandoProveedor] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [verDetalleOpen, setVerDetalleOpen] = useState(false);
  const [detalleProveedor, setDetalleProveedor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [proveedoresPorPagina] = useState(5);

  // Función para cargar proveedores desde la API
  const cargarProveedores = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.PROVEEDORES.GET_ALL), {
        method: 'GET',
        headers: DEFAULT_HEADERS
      });
      
      if (response.ok) {
        const data = await response.json();
        setProveedores(data);
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los proveedores. Verifique su conexión.',
        timer: 3000,
        showConfirmButton: false
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  const validarProveedor = (proveedor) => {
    // Solo validar el campo 'nombre' que es el único requerido según el modelo del backend
    return proveedor.nombre?.trim() !== '';
  };

  // Validaciones adicionales: correo y documento/NIT (opcionales pero deben ser válidos si se ingresan)
  const validarProveedorCampos = (p) => {
    const email = (p.correo || '').trim();
    const doc = (p.documento || '').trim();
    const tel = (p.telefono || p.celular || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      return { valid: false, message: 'Correo electrónico inválido.' };
    }
    const digitsOnly = /^\d+$/;
    if (doc && !digitsOnly.test(doc)) {
      return { valid: false, message: 'Documento/NIT debe ser numérico.' };
    }
    if (tel && !digitsOnly.test(tel)) {
      return { valid: false, message: 'Teléfono debe ser numérico.' };
    }
    if (doc && doc.length !== 10) {
      return { valid: false, message: 'El documento debe tener exactamente 10 dígitos.' };
    }
    if (tel && tel.length !== 10) {
      return { valid: false, message: 'El teléfono debe tener exactamente 10 dígitos.' };
    }
    return { valid: true };
  };

  // Normaliza el proveedor del backend al esquema del formulario
  const normalizarProveedorParaFormulario = (p) => {
    const tipoPersona = p.tipoPersona || (p.razonSocial ? 'juridica' : 'natural');
    return {
      empresa: p.empresa || '',
      tipoPersona,
      nombre: tipoPersona === 'juridica' ? (p.razonSocial || p.nombre || '') : (p.nombres || p.nombre || ''),
      contacto: tipoPersona === 'juridica' ? (p.representanteLegal || p.contacto || '') : (p.apellidos || p.contacto || ''),
      telefono: p.telefono || '',
      celular: p.celular || '',
      correo: p.email || p.correo || '',
      direccion: p.direccion || '',
      ciudad: p.ciudad || '',
      tipoDocumento: p.tipoDocumento || '',
      documento: p.documento || p.nit || '',
      tipoDocumentoIdTipoDocumento: p.tipoDocumentoIdTipoDocumento || 1,
      activo: p.activo !== false
    };
  };

  const agregarProveedor = async () => {
    if (!validarProveedor(nuevoProveedor)) {
      return Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'El nombre del proveedor es requerido.',
        timer: 2000,
        showConfirmButton: false
      });
    }
    const val = validarProveedorCampos(nuevoProveedor);
    if (!val.valid) {
      return Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: val.message,
        timer: 2500,
        showConfirmButton: false
      });
    }
    
    setLoading(true);
    try {
      // Mapear los campos del frontend a la estructura que espera la API
      const proveedorParaAPI = {
        tipoPersona: nuevoProveedor.tipoPersona || 'natural',
        nombre: nuevoProveedor.nombre || 'Sin nombre', // Campo requerido por el backend
        documento: String(nuevoProveedor.documento || '').replace(/\D/g, '').slice(0, 10) || '0000000000',
        email: nuevoProveedor.correo || `temp${Date.now()}@example.com`,
        celular: String(nuevoProveedor.celular || '').replace(/\D/g, '').slice(0, 10),
        telefono: String(nuevoProveedor.telefono || '').replace(/\D/g, '').slice(0, 10),
        direccion: nuevoProveedor.direccion,
        ciudad: nuevoProveedor.ciudad,
        nombres: nuevoProveedor.tipoPersona === 'natural' ? nuevoProveedor.nombre : null,
        apellidos: nuevoProveedor.tipoPersona === 'natural' ? nuevoProveedor.contacto : null,
        razonSocial: nuevoProveedor.tipoPersona === 'juridica' ? nuevoProveedor.nombre : null,
        representanteLegal: nuevoProveedor.tipoPersona === 'juridica' ? nuevoProveedor.contacto : null,
        nit: nuevoProveedor.tipoPersona === 'juridica' ? (String(nuevoProveedor.documento || '').replace(/\D/g, '').slice(0, 10)) : null,
        tipoDocumentoIdTipoDocumento: nuevoProveedor.tipoDocumentoIdTipoDocumento || 1
      };
      
      const response = await fetch(buildApiUrl(API_ENDPOINTS.PROVEEDORES.CREATE), {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(proveedorParaAPI)
      });
      
      if (response.ok) {
        const nuevoProveedorCreado = await response.json();
        setProveedores([...proveedores, nuevoProveedorCreado]);
        Swal.fire({
          icon: 'success',
          title: 'Guardado',
          text: 'Proveedor agregado exitosamente.',
          timer: 2000,
          showConfirmButton: false
        });
        resetFormulario();
        setMostrarFormulario(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error al agregar proveedor:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo agregar el proveedor. Intente nuevamente.',
        timer: 3000,
        showConfirmButton: false
      });
    } finally {
      setLoading(false);
    }
  };

  const editarProveedor = (proveedor) => {
    if (!proveedor?.activo) {
      AlertService.info('Proveedor inactivo', 'No puedes editar un proveedor inactivo. Actívalo para continuar.');
      return;
    }
    setNuevoProveedor(normalizarProveedorParaFormulario(proveedor));
    setEditandoProveedor(proveedor.id);
    setMostrarFormulario(true);
  };

  const actualizarProveedor = async () => {
    if (!validarProveedor(nuevoProveedor)) {
      return Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'El nombre del proveedor es requerido.',
        timer: 2000,
        showConfirmButton: false
      });
    }
    const val = validarProveedorCampos(nuevoProveedor);
    if (!val.valid) {
      return Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: val.message,
        timer: 2500,
        showConfirmButton: false
      });
    }
    
    setLoading(true);
    try {
      // Mapear los campos del frontend a la estructura que espera la API
      const proveedorParaAPI = {
        id: editandoProveedor,
        tipoPersona: nuevoProveedor.tipoPersona || 'natural',
        nombre: nuevoProveedor.nombre || 'Sin nombre', // Campo requerido por el backend
        documento: String(nuevoProveedor.documento || '').replace(/\D/g, '').slice(0, 10) || '0000000000',
        email: nuevoProveedor.correo || `temp${Date.now()}@example.com`,
        celular: String(nuevoProveedor.celular || '').replace(/\D/g, '').slice(0, 10),
        telefono: String(nuevoProveedor.telefono || '').replace(/\D/g, '').slice(0, 10),
        direccion: nuevoProveedor.direccion,
        ciudad: nuevoProveedor.ciudad,
        nombres: nuevoProveedor.tipoPersona === 'natural' ? nuevoProveedor.nombre : null,
        apellidos: nuevoProveedor.tipoPersona === 'natural' ? nuevoProveedor.contacto : null,
        razonSocial: nuevoProveedor.tipoPersona === 'juridica' ? nuevoProveedor.nombre : null,
        representanteLegal: nuevoProveedor.tipoPersona === 'juridica' ? nuevoProveedor.contacto : null,
        nit: nuevoProveedor.tipoPersona === 'juridica' ? (String(nuevoProveedor.documento || '').replace(/\D/g, '').slice(0, 10)) : null,
        tipoDocumentoIdTipoDocumento: nuevoProveedor.tipoDocumentoIdTipoDocumento || 1,
        activo: nuevoProveedor.activo !== false
      };
      
      const response = await fetch(buildApiUrl(API_ENDPOINTS.PROVEEDORES.UPDATE.replace(':id', editandoProveedor)), {
        method: 'PUT',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(proveedorParaAPI)
      });
      
      if (response.ok) {
        const proveedorActualizado = await response.json();
        setProveedores(proveedores.map(p => p.id === editandoProveedor ? proveedorActualizado : p));
        Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'Proveedor actualizado exitosamente.',
          timer: 2000,
          showConfirmButton: false
        });
        resetFormulario();
        setMostrarFormulario(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo actualizar el proveedor. Intente nuevamente.',
        timer: 3000,
        showConfirmButton: false
      });
    } finally {
      setLoading(false);
    }
  };

  const eliminarProveedor = async (id) => {
    const proveedorObj = proveedores.find(p => p.id === id);
    const displayName = proveedorObj
      ? (proveedorObj.tipoPersona === 'natural'
          ? (`${(proveedorObj.nombres || '').trim()} ${(proveedorObj.apellidos || '').trim()}`).trim() || proveedorObj.nombre
          : (proveedorObj.razonSocial || proveedorObj.nombre))
      : `ID ${id}`;

    const result = await Swal.fire({
      title: '¿Eliminar proveedor?',
      text: `Se eliminará "${displayName}" (ID: ${id}). Esta acción no se puede deshacer.`,
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
        const response = await fetch(buildApiUrl(API_ENDPOINTS.PROVEEDORES.DELETE.replace(':id', id)), {
          method: 'DELETE',
          headers: DEFAULT_HEADERS
        });
        
        if (response.ok) {
          setProveedores(proveedores.filter(p => p.id !== id));
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: `Proveedor "${displayName}" (ID: ${id}) eliminado exitosamente.`,
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `No se pudo eliminar "${displayName}" (ID: ${id}). Intente nuevamente.`,
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
    setNuevoProveedor({
      empresa: '',
      nombre: '',
      contacto: '',
      celular: '',
      correo: '',
      direccion: '',
      ciudad: '',
      tipoDocumento: '',
      documento: '',
      tipoPersona: '',
      activo: true
    });
    setEditandoProveedor(null);
  };

  const verDetalles = (proveedor) => {
    setDetalleProveedor(proveedor);
    setVerDetalleOpen(true);
  };

  const cerrarDetalles = () => {
    setVerDetalleOpen(false);
    setDetalleProveedor(null);
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    setUpdatingId(id);
    setLoading(true);
    try {
      await proveedoresService.cambiarEstadoProveedor(id, nuevoEstado);

      const proveedorObj = proveedores.find(p => p.id === id);
      const displayName = proveedorObj
        ? (proveedorObj.tipoPersona === 'natural'
            ? (`${(proveedorObj.nombres || '').trim()} ${(proveedorObj.apellidos || '').trim()}`).trim() || proveedorObj.nombre
            : (proveedorObj.razonSocial || proveedorObj.nombre))
        : `ID ${id}`;

      // Actualizar estado local inmediatamente
      setProveedores(prev => prev.map(p => p.id === id ? { ...p, activo: nuevoEstado } : p));

      await Swal.fire({
        icon: 'success',
        title: nuevoEstado ? '¡Activado!' : '¡Desactivado!',
        text: `Proveedor "${displayName}" (ID: ${id}) ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al cambiar estado del proveedor:', error);
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



  // Normaliza texto para búsqueda (utilidad compartida)

  // Normaliza números: solo dígitos
  const normalizarNumero = (n) => String(n || '').replace(/\D/g, '');

  // Diferir la entrada para evitar bloqueos en listas grandes
  const deferredBusqueda = useDeferredValue(busqueda);

  // Índice de búsqueda precomputado para mejorar rendimiento
  const indiceBusqueda = useMemo(() => {
    return proveedores.map((p) => {
      const composite = normalizeText([
        p.id,
        p.empresa,
        p.nombre,
        p.razonSocial,
        p.nombres,
        p.apellidos,
        p.contacto,
        p.documento,
        p.nit,
        p.email,
        p.telefono,
        p.celular,
        p.direccion,
        p.ciudad,
        p.tipoPersona,
        p.activo ? 'activo' : 'inactivo'
      ].join(' '));

      return {
        p,
        composite,
        doc: normalizarNumero(p.documento || p.nit),
        nombre: normalizeText(p.nombres || p.nombre || ''),
        razon: normalizeText(p.razonSocial || p.nombre || ''),
        contacto: normalizeText(p.apellidos || p.contacto || ''),
        email: normalizeText(p.email || p.correo || ''),
        telefono: normalizarNumero(p.telefono || p.celular),
        ciudad: normalizeText(p.ciudad || ''),
        direccion: normalizeText(p.direccion || ''),
        tipo: normalizeText(p.tipoPersona || ''),
        id: String(p.id || '')
      };
    });
  }, [proveedores]);

  const proveedoresFiltrados = useMemo(() => {
    const raw = deferredBusqueda || '';
    const hasQueryPairs = raw.includes(':');
    const term = normalizeText(raw);
    if (!term) return proveedores;

    const tokens = term.split(/\s+/).filter(Boolean);

    if (!hasQueryPairs) {
      // Búsqueda AND por tokens en el composite
      return indiceBusqueda
        .filter(({ composite }) => tokens.every((t) => composite.includes(t)))
        .map((e) => e.p);
    }

    // Búsqueda avanzada: pares campo:valor + tokens
    const pares = [];
    const otrosTokens = [];
    raw.split(/\s+/).forEach((part) => {
      const m = part.match(/^([a-zA-Z]+):(.*)$/);
      if (m) {
        const key = m[1].toLowerCase();
        const valueText = m[2];
        pares.push({ key, valueText });
      } else {
        const t = normalizeText(part);
        if (t) otrosTokens.push(t);
      }
    });

    return indiceBusqueda
      .filter((item) => {
        const pairMatch = pares.every(({ key, valueText }) => {
          const value = normalizeText(valueText);
          switch (key) {
            case 'doc':
            case 'nit':
            case 'documento':
              return item.doc.includes(normalizarNumero(valueText));
            case 'nombre':
              return item.nombre.includes(value);
            case 'razon':
            case 'razon_social':
              return item.razon.includes(value);
            case 'contacto':
            case 'apellidos':
              return item.contacto.includes(value);
            case 'email':
            case 'correo':
              return item.email.includes(value);
            case 'tel':
            case 'telefono':
            case 'cel':
            case 'celular':
              return item.telefono.includes(normalizarNumero(valueText));
            case 'ciudad':
              return item.ciudad.includes(value);
            case 'direccion':
              return item.direccion.includes(value);
            case 'tipo':
            case 'tipopersona':
              return item.tipo.includes(value);
            case 'id':
              return item.id.includes(value);
            case 'estado':
              return (item.p.activo ? 'activo' : 'inactivo').includes(value);
            default:
              // fallback al composite si el campo es desconocido
              return item.composite.includes(value);
          }
        });

        const tokensMatch = otrosTokens.length === 0 || otrosTokens.every((t) => item.composite.includes(t));
        return pairMatch && tokensMatch;
      })
      .map((e) => e.p);
  }, [deferredBusqueda, indiceBusqueda]);

  // Resetear paginación al cambiar la búsqueda
  useEffect(() => {
    setPaginaActual(1);
  }, [deferredBusqueda]);
  const indiceUltimoProveedor = paginaActual * proveedoresPorPagina;
  const indicePrimerProveedor = indiceUltimoProveedor - proveedoresPorPagina;
  const proveedoresActuales = proveedoresFiltrados.slice(indicePrimerProveedor, indiceUltimoProveedor);
  const totalPaginas = Math.ceil(proveedoresFiltrados.length / proveedoresPorPagina);



  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  return (
    <div className="proveedores-container">
      <div className="proveedores-header">
        <div className="header-left">
          <h2>PROVEEDORES <span className="contador-proveedores">({proveedoresFiltrados.length})</span></h2>
        </div>
        <div className="header-right">
          <input
            type="text"
            className="input-busqueda"
            placeholder="Buscar por doc, nombre, razón, email, ciudad... (ej: doc:123, nombre: Ana)"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          {/* Botón restaurado para abrir el formulario de creación */}
          <button
            className="btn-agregar"
            onClick={() => { resetFormulario(); setMostrarFormulario(true); }}
          >
            Agregar Proveedor
          </button>
        </div>
      </div>

      <Dialog.Root open={mostrarFormulario} onOpenChange={(open) => {
        if (!open) {
          resetFormulario();
          setMostrarFormulario(false);
        }
      }}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className={`dialog-content ${!nuevoProveedor.tipoPersona ? 'modal-tipo-persona' : ''}`}>
            <Dialog.Close className="dialog-close">×</Dialog.Close>
            
            <Dialog.Title className="dialog-title">
              {editandoProveedor ? 'Editar Proveedor' : 'Formulario de agregar proveedor'}
            </Dialog.Title>
            <div className={`formulario-unico`}>
              <div className="grupo-campo">
                <label>Tipo de Persona:</label>
                <select
                  value={nuevoProveedor.tipoPersona}
                  onChange={(e) => {
                    const tipoPersona = e.target.value;
                    setNuevoProveedor({
                      ...nuevoProveedor,
                      tipoPersona,
                      nombre: '', contacto: '', telefono: '',
                      documento: '', tipoDocumento: ''
                    });
                  }}
                >
                  <option value="">Selecciona tipo de persona</option>
                  <option value="natural">Persona Natural</option>
                  <option value="juridica">Persona Jurídica</option>
                </select>
              </div>

              {nuevoProveedor.tipoPersona === 'natural' ? (
                <>
                  <div className="grupo-campo">
                    <label>Nombres:</label>
                    <input
                      type="text"
                      value={nuevoProveedor.nombre}
                      onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, nombre: e.target.value })}
                      placeholder="Nombres"
                    />
                  </div>
                  <div className="grupo-campo">
                    <label>Apellidos:</label>
                    <input
                      type="text"
                      value={nuevoProveedor.contacto}
                      onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, contacto: e.target.value })}
                      placeholder="Apellidos"
                    />
                  </div>
                  <div className="grupo-campo">
                    <label>Tipo de Documento:</label>
                    <select
                      value={nuevoProveedor.tipoDocumento}
                      onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, tipoDocumento: e.target.value })}
                    >
                      <option value="">Tipo Documento</option>
                      <option value="CC">Cédula de Ciudadanía</option>
                      <option value="CE">Cédula de Extranjería</option>
                    </select>
                  </div>
                  <div className="grupo-campo">
                    <label>Número de Documento:</label>
                    <input
                      type="tel"
                      value={nuevoProveedor.documento}
                      onChange={(e) => {
                        const v = String(e.target.value || '').replace(/\D/g, '').slice(0, 10);
                        setNuevoProveedor({ ...nuevoProveedor, documento: v });
                      }}
                      maxLength={10}
                      inputMode="numeric"
                      pattern="\d{0,10}"
                      placeholder="Número de Documento"
                    />
                  </div>
                </>
              ) : nuevoProveedor.tipoPersona === 'juridica' ? (
                <>
                  <div className="grupo-campo">
                    <label>Razón Social:</label>
                    <input
                      type="text"
                      value={nuevoProveedor.nombre}
                      onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, nombre: e.target.value })}
                      placeholder="Razón Social"
                    />
                  </div>
                  <div className="grupo-campo">
                    <label>Representante Legal:</label>
                    <input
                      type="text"
                      value={nuevoProveedor.contacto}
                      onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, contacto: e.target.value })}
                      placeholder="Representante Legal"
                    />
                  </div>
                  <div className="grupo-campo">
                    <label>NIT:</label>
                    <input
                      type="tel"
                      value={nuevoProveedor.documento}
                      onChange={(e) => {
                        const v = String(e.target.value || '').replace(/\D/g, '').slice(0, 10);
                        setNuevoProveedor({ ...nuevoProveedor, documento: v });
                      }}
                      maxLength={10}
                      inputMode="numeric"
                      pattern="\d{0,10}"
                      placeholder="NIT"
                    />
                  </div>
                </>
              ) : null}

              {nuevoProveedor.tipoPersona && (
                <>
                  <div className="grupo-campo">
                    <label>Teléfono:</label>
                    <input
                      type="tel"
                      value={nuevoProveedor.telefono}
                      onChange={(e) => {
                        const v = String(e.target.value || '').replace(/\D/g, '').slice(0, 10);
                        setNuevoProveedor({ ...nuevoProveedor, telefono: v });
                      }}
                      maxLength={10}
                      inputMode="numeric"
                      pattern="\d{0,10}"
                      placeholder="Teléfono"
                    />
                  </div>

                  <div className="grupo-campo">
                    <label>Correo Electrónico:</label>
                    <input
                      type="email"
                      value={nuevoProveedor.correo}
                      onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, correo: e.target.value })}
                      placeholder="Correo Electrónico"
                    />
                  </div>

                  <div className="grupo-campo">
                    <label>Dirección:</label>
                    <input
                      type="text"
                      value={nuevoProveedor.direccion}
                      onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, direccion: e.target.value })}
                      placeholder="Dirección"
                    />
                  </div>

                  <div className="grupo-campo">
                    <label>Ciudad:</label>
                    <input
                      type="text"
                      value={nuevoProveedor.ciudad}
                      onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, ciudad: e.target.value })}
                      placeholder="Ciudad"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="dialog-actions-centrado">
              <button
                className="btn btn-confirmar"
                onClick={editandoProveedor ? actualizarProveedor : agregarProveedor}
              >
                {editandoProveedor ? 'Actualizar Proveedor' : 'Agregar Proveedor'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={verDetalleOpen} onOpenChange={setVerDetalleOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content dialog-detalles">
            <Dialog.Close asChild>
              <button className="dialog-close" aria-label="Cerrar">&times;</button>
            </Dialog.Close>
            
            <Dialog.Title className="modal-titulo-base">
              Detalles del Proveedor
            </Dialog.Title>

            {detalleProveedor && (
              <>
                <div className="seccion-detalles-base">
                  <h3 className="titulo-seccion-base">Información Personal</h3>
                  <div className="formulario-dos-columnas-base">
                    <div className="detalle-grupo-base">
                      <label>Tipo de Persona:</label>
                      <span>{detalleProveedor.tipoPersona === 'natural' ? 'Persona Natural' : 'Persona Jurídica'}</span>
                    </div>
                    
                    {detalleProveedor.tipoPersona === 'natural' ? (
                      <>
                        <div className="detalle-grupo-base">
                          <label>Nombres:</label>
                          <span>{detalleProveedor.nombres || detalleProveedor.nombre || 'N/A'}</span>
                        </div>
                        <div className="detalle-grupo-base">
                          <label>Apellidos:</label>
                          <span>{detalleProveedor.apellidos || detalleProveedor.contacto || 'N/A'}</span>
                        </div>
                        <div className="detalle-grupo-base">
                          <label>Tipo de Documento:</label>
                          <span>{detalleProveedor.tipoDocumento === 'CC' ? 'Cédula de Ciudadanía' : detalleProveedor.tipoDocumento === 'CE' ? 'Cédula de Extranjería' : (detalleProveedor.tipoDocumento || 'N/A')}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="detalle-grupo-base">
                          <label>Razón Social:</label>
                          <span>{detalleProveedor.razonSocial || detalleProveedor.nombre || 'N/A'}</span>
                        </div>
                        <div className="detalle-grupo-base">
                          <label>Representante Legal:</label>
                          <span>{detalleProveedor.representanteLegal || detalleProveedor.contacto || 'N/A'}</span>
                        </div>
                        <div className="detalle-grupo-base">
                          <label>NIT:</label>
                          <span>{detalleProveedor.nit || detalleProveedor.documento || 'N/A'}</span>
                        </div>
                      </>
                    )}
                    
                    {detalleProveedor.tipoPersona === 'natural' && (
                      <div className="detalle-grupo-base">
                        <label>Número de Documento:</label>
                        <span>{detalleProveedor.documento || 'N/A'}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="seccion-detalles-base">
                  <h3 className="titulo-seccion-base">Información de Contacto</h3>
                  <div className="formulario-dos-columnas-base">
                    <div className="detalle-grupo-base">
                      <label>Teléfono:</label>
                      <span>{detalleProveedor.telefono || detalleProveedor.celular || 'N/A'}</span>
                    </div>
                    <div className="detalle-grupo-base">
                      <label>Email:</label>
                      <span>{detalleProveedor.email || detalleProveedor.correo || 'N/A'}</span>
                    </div>
                    <div className="detalle-grupo-base">
                      <label>Dirección:</label>
                      <span>{detalleProveedor.direccion || 'N/A'}</span>
                    </div>
                    <div className="detalle-grupo-base">
                      <label>Ciudad:</label>
                      <span>{detalleProveedor.ciudad || 'N/A'}</span>
                    </div>
                    <div className="detalle-grupo-base">
                      <label>Estado:</label>
                      <span className={`estado-badge ${detalleProveedor.activo ? 'activo' : 'inactivo'}`}>
                        {detalleProveedor.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
            

          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="tabla-wrapper">
        <table className="tabla-proveedores">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tipo</th>
              <th>Nombre/Razón Social</th>
              <th>Documento</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th>Ciudad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proveedoresActuales.length > 0 ? (
              proveedoresActuales.map((proveedor) => (
                <tr key={proveedor.id} className={!proveedor.activo ? 'fila-anulada' : ''}>
                  <td>{proveedor.id}</td>
                  <td>
                    <span className={`tipo-persona ${proveedor.tipoPersona}`}>
                      {proveedor.tipoPersona === 'natural' ? 'Natural' : 
                       proveedor.tipoPersona === 'juridica' ? 'Jurídica' : 
                       proveedor.tipoPersona || 'N/A'}
                    </span>
                  </td>
                  <td>
                    {proveedor.tipoPersona === 'natural' 
                      ? `${proveedor.nombres || ''} ${proveedor.apellidos || ''}`.trim() || proveedor.nombre
                      : proveedor.razonSocial || proveedor.nombre}
                  </td>
                  <td>{proveedor.documento || 'N/A'}</td>
                  <td>{proveedor.email || 'N/A'}</td>
                  <td>{proveedor.telefono || proveedor.celular || 'N/A'}</td>
                  <td>{proveedor.direccion || 'N/A'}</td>
                  <td>{proveedor.ciudad || 'N/A'}</td>
                  <td>
                    <button
                      className={`estado ${proveedor.activo ? 'activa' : 'anulada'}`}
                      onClick={() => cambiarEstado(proveedor.id, !proveedor.activo)}
                      title={proveedor.activo ? 'Clic para desactivar' : 'Clic para activar'}
                      disabled={loading || updatingId === proveedor.id}
                    >
                      {proveedor.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="acciones">
                  <button className="btn-icono btn-detalles" onClick={() => verDetalles(proveedor)} title="Ver Detalles">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#6b7280"/>
                    </svg>
                  </button>

                  <button className="btn-icono btn-editar" title="Editar" onClick={() => editarProveedor(proveedor)} disabled={!proveedor.activo || loading || updatingId === proveedor.id}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#000000"/>
                    </svg>
                  </button>
                  <button className="btn-icono btn-eliminar" title="Eliminar" onClick={() => eliminarProveedor(proveedor.id)} disabled={!proveedor.activo || loading || deletingId === proveedor.id} aria-busy={deletingId === proveedor.id}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#dc2626"/>
                    </svg>
                  </button>
                </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8" className="sin-resultados">No se encontraron resultados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <Pagination
        currentPage={paginaActual}
        totalPages={totalPaginas}
        onPageChange={cambiarPagina}
        itemsPerPage={proveedoresPorPagina}
        totalItems={proveedoresFiltrados.length}
        showInfo={true}
      />
    </div>
  );
};

export default ProveedoresTable;

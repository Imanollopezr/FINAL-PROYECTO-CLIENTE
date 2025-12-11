import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import medidasService from '../../services/medidasService';
import { API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '../../constants/apiConstants';
import { getToken as getStoreToken } from '../../features/auth/tokenStore';
import AlertService from '../shared/AlertService';
import Pagination from '../shared/Pagination';
import './MedidasTable.scss';
import { useCancelableFetch } from '../../shared/hooks/useCancelableFetch';

const MedidasTable = ({ mode = 'medidas' }) => {
  const effectiveMode = (mode === 'tallas' || (typeof window !== 'undefined' && window.location && window.location.pathname.includes('/tallas'))) ? 'tallas' : 'medidas';
  const TALLAS_COMUNES = ['XXS','XS','S','M','L','XL','XXL'];
  const [medidas, setMedidas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [nuevaMedida, setNuevaMedida] = useState({
    nombre: '',
    abreviatura: '',
    descripcion: '',
    activo: true
  });
  
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoMedida, setEditandoMedida] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [medidaSeleccionada, setMedidaSeleccionada] = useState(null);
  const [erroresMedida, setErroresMedida] = useState({});
  
  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [medidasPorPagina] = useState(5);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const { nextSignal } = useCancelableFetch();
  
  // Estados para filtros de fecha
  // const [filtroAno, setFiltroAno] = useState(''); // Eliminado
  // const [filtroMes, setFiltroMes] = useState(''); // Eliminado
  // const [filtroDia, setFiltroDia] = useState(''); // Eliminado

  // Función para cargar medidas desde la API
  const cargarMedidas = async () => {
    const signal = nextSignal();
    try {
      setLoading(true);
      let list = [];
      if (effectiveMode === 'tallas') {
        const bearer = getStoreToken();
        const headers = bearer ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${bearer}` } : { ...DEFAULT_HEADERS };
        const resp = await fetch(buildApiUrl('/api/tallas?includeInactive=true'), { headers, credentials: 'include', signal });
        if (!resp.ok) throw new Error(`Error ${resp.status}: ${resp.statusText}`);
        const raw = await resp.json();
        const dataArr = Array.isArray(raw) ? raw : [];
        list = dataArr.map(t => ({ ...t, idMedida: t.idTalla ?? t.IdTalla ?? t.id }));
      } else {
        const data = await medidasService.obtenerMedidas(signal);
        list = Array.isArray(data) ? data : [];
      }
      setMedidas(list);
      // Ajuste de paginación si la página actual superó el total de páginas
      const totalPaginasData = Math.ceil(((list?.length || 0)) / medidasPorPagina);
      if (paginaActual > totalPaginasData && totalPaginasData >= 1) {
        setPaginaActual(totalPaginasData);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error al cargar medidas:', error);
        AlertService.error('Error', 'No se pudieron cargar las medidas');
      }
    } finally {
      setLoading(false);
    }
  };

  const esTallaValida = (m) => {
    const valNom = String(m?.nombre || '').toUpperCase().trim();
    const valAbr = String(m?.abreviatura || '').toUpperCase().trim();
    const set = new Set(['XXS','XS','S','M','L','XL','XXL','XXXL','U','UNICO']);
    return set.has(valNom) || set.has(valAbr);
  };

  // Eliminado: agregarTallasComunes

  // Función para buscar medidas
  const buscarMedidas = async (termino) => {
    if (!termino.trim()) {
      cargarMedidas();
      return;
    }

    try {
      setLoading(true);
      if (effectiveMode === 'tallas') {
        const bearer = getStoreToken();
        const headers = bearer ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${bearer}` } : { ...DEFAULT_HEADERS };
        const resp = await fetch(buildApiUrl('/api/tallas?includeInactive=true'), { headers, credentials: 'include' });
        if (!resp.ok) throw new Error(`Error ${resp.status}: ${resp.statusText}`);
        const raw = await resp.json();
        const base = Array.isArray(raw) ? raw : [];
        const filtrado = base.filter(t => String(t?.nombre || '').toLowerCase().includes(termino.toLowerCase()));
        const normalizados = filtrado.map(t => ({ ...t, idMedida: t.idTalla ?? t.IdTalla ?? t.id }));
        setMedidas(normalizados);
      } else {
        const data = await medidasService.buscarMedidas(termino);
        setMedidas(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      try {
        const base = (medidas && medidas.length > 0) ? medidas : await medidasService.obtenerMedidas();
        const lower = termino.toLowerCase();
        const filtradoLocal = (base || []).filter(m =>
          String(m?.nombre || '').toLowerCase().includes(lower) ||
          String(m?.abreviatura || '').toLowerCase().includes(lower) ||
          String(m?.descripcion || '').toLowerCase().includes(lower)
        );
        setMedidas(filtradoLocal);
      } catch (inner) {
        console.error('Error al buscar medidas:', inner || error);
        AlertService.error('Error', 'No se pudieron buscar las medidas');
      }
    } finally {
      setLoading(false);
    }
  };

  // Efecto para búsqueda con debounce (evitar ejecución en el primer render)
  const firstSearchRef = useRef(true);
  useEffect(() => {
    if (firstSearchRef.current) {
      firstSearchRef.current = false;
      return; // Evita doble carga inicial y parpadeo
    }
    const timeoutId = setTimeout(() => {
      if (busqueda.trim()) {
        buscarMedidas(busqueda);
      } else {
        cargarMedidas();
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [busqueda]);

  useEffect(() => {
    // reset al cambiar entre rutas de medidas/tallas
    setBusqueda('');
    setPaginaActual(1);
    cargarMedidas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveMode]);

  const validarMedida = (medida) => {
    const nombre = String(medida?.nombre || '').trim();
    // En modo tallas permitir agregar tallas normales: solo campo requerido
    return nombre !== '';
  };

  const agregarMedida = async () => {
    if (!validarMedida(nuevaMedida)) {
      return AlertService.warning('Campos incompletos', 'El nombre de la medida es requerido.');
    }

    try {
      if (effectiveMode === 'tallas') {
        const bearer = getStoreToken();
        const headers = bearer ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' } : { ...DEFAULT_HEADERS, 'Content-Type': 'application/json' };
        const payload = { Nombre: nuevaMedida.nombre, Descripcion: nuevaMedida.descripcion || '', Abreviatura: nuevaMedida.abreviatura || '' };
        const resp = await fetch(buildApiUrl('/api/tallas'), { method: 'POST', headers, credentials: 'include', body: JSON.stringify(payload) });
        if (!resp.ok) {
          const errTxt = await resp.text().catch(() => '');
          throw new Error(`Error ${resp.status}: ${errTxt || resp.statusText}`);
        }
        AlertService.success('Talla agregada', 'La talla se agregó correctamente.');
      } else {
        await medidasService.crearMedida(nuevaMedida);
        AlertService.success('Medida agregada', 'La medida se agregó correctamente.');
      }
      setNuevaMedida({ nombre: '', abreviatura: '', descripcion: '', activo: true });
      setMostrarFormulario(false);
      cargarMedidas();
    } catch (error) {
      console.error('Error al agregar medida:', error);
      AlertService.error('Error', 'No se pudo agregar la medida.');
    }
  };

  const editarMedida = (medida) => {
    if (medida && medida.activo === false) {
      AlertService.info('Medida inactiva', 'No puedes editar una medida inactiva. Actívala para continuar.');
      return;
    }
    setEditandoMedida(medida);
    setNuevaMedida({
      nombre: medida.nombre,
      abreviatura: medida.abreviatura || '',
      descripcion: medida.descripcion || '',
      activo: medida.activo
    });
    setMostrarFormulario(true);
  };

  const actualizarMedida = async () => {
    if (!validarMedida(nuevaMedida)) {
      return AlertService.warning('Campos incompletos', 'El nombre de la medida es requerido.');
    }

    try {
      if (effectiveMode === 'tallas') {
        const bearer = getStoreToken();
        const headers = bearer ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' } : { ...DEFAULT_HEADERS, 'Content-Type': 'application/json' };
        const payload = {
          IdTalla: editandoMedida.idMedida,
          Nombre: nuevaMedida.nombre,
          Abreviatura: nuevaMedida.abreviatura || '',
          Descripcion: nuevaMedida.descripcion || '',
          Activo: nuevaMedida.activo
        };
        const resp = await fetch(buildApiUrl(`/api/tallas/${editandoMedida.idMedida}`), { method: 'PUT', headers, credentials: 'include', body: JSON.stringify(payload) });
        if (!resp.ok) {
          const errTxt = await resp.text().catch(() => '');
          throw new Error(`Error ${resp.status}: ${errTxt || resp.statusText}`);
        }
        AlertService.success('Talla actualizada', 'La talla se actualizó correctamente.');
      } else {
        // Preparar el objeto medida con los campos correctos para la API
        const medidaActualizada = {
          IdMedida: editandoMedida.idMedida,
          Nombre: nuevaMedida.nombre,
          Abreviatura: nuevaMedida.abreviatura || '',
          Descripcion: nuevaMedida.descripcion || '',
          Activo: nuevaMedida.activo,
          FechaRegistro: editandoMedida.fechaRegistro
        };
        await medidasService.actualizarMedida(editandoMedida.idMedida, medidaActualizada);
        AlertService.success('Medida actualizada', 'La medida se actualizó correctamente.');
      }
      setNuevaMedida({ nombre: '', abreviatura: '', descripcion: '', activo: true });
      setMostrarFormulario(false);
      setEditandoMedida(null);
      cargarMedidas();
    } catch (error) {
      console.error('Error al actualizar medida:', error);
      AlertService.error('Error', 'No se pudo actualizar la medida.');
    }
  };

  const eliminarMedida = async (id) => {
    if (deletingId) return;
    const medida = medidas.find(m => m.idMedida === id);
    const medidaNombre = (medida?.nombre) || '';
    const result = await AlertService.confirmDelete('¿Eliminar medida?', medidaNombre ? `Se eliminará la medida ${medidaNombre} (ID ${id}).` : 'Esta acción no se puede deshacer');

    if (result.isConfirmed) {
      try {
        setDeletingId(id);
        if (effectiveMode === 'tallas') {
          const bearer = getStoreToken();
          const headers = bearer ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${bearer}` } : { ...DEFAULT_HEADERS };
          const resp = await fetch(buildApiUrl(`/api/tallas/${id}`), { method: 'DELETE', headers, credentials: 'include' });
          if (!resp.ok) {
            const errTxt = await resp.text().catch(() => '');
            throw new Error(`Error ${resp.status}: ${errTxt || resp.statusText}`);
          }
          AlertService.success('Talla eliminada', `La talla ${medidaNombre || ''} (ID ${id}) se desactivó correctamente.`);
        } else {
          await medidasService.eliminarMedida(id);
          AlertService.success('Medida eliminada', `La medida ${medidaNombre || ''} (ID ${id}) se eliminó correctamente.`);
        }
        // Remover del estado local para que desaparezca aunque el backend marque inactiva
        setMedidas(prev => (prev || []).filter(m => (m.idMedida ?? m.id) !== id));
        // Si la página queda vacía tras eliminar, retroceder una página
        const indiceUltimaMedidaPost = paginaActual * medidasPorPagina;
        const indicePrimeraMedidaPost = indiceUltimaMedidaPost - medidasPorPagina;
        const medidasActualesPost = ((medidas || []).filter(m => (m.idMedida ?? m.id) !== id)).slice(indicePrimeraMedidaPost, indiceUltimaMedidaPost);
        if (medidasActualesPost.length === 0 && paginaActual > 1) {
          setPaginaActual(paginaActual - 1);
        }
      } catch (error) {
        console.error('Error al eliminar medida:', error);
        AlertService.error('Error al eliminar', error.message || 'No se pudo eliminar la medida.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    const medidaNombre = (medidas.find(m => m.idMedida === id)?.nombre) || '';
    try {
      setUpdatingId(id);
      if (effectiveMode === 'tallas') {
        const bearer = getStoreToken();
        const headers = bearer ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${bearer}` } : { ...DEFAULT_HEADERS };
        const resp = await fetch(buildApiUrl(`/api/tallas/${id}/estado`), { method: 'PATCH', headers, credentials: 'include', body: JSON.stringify({ activo: nuevoEstado }) });
        if (!resp.ok) {
          const errTxt = await resp.text().catch(() => '');
          throw new Error(`Error ${resp.status}: ${errTxt || resp.statusText}`);
        }
        AlertService.success('Estado actualizado', `La talla ${medidaNombre || ''} (ID ${id}) se ${nuevoEstado ? 'activó' : 'desactivó'} correctamente.`);
      } else {
        await medidasService.cambiarEstadoMedida(id, nuevoEstado);
        AlertService.success('Estado actualizado', `La medida ${medidaNombre || ''} (ID ${id}) se ${nuevoEstado ? 'activó' : 'desactivó'} correctamente.`);
      }
      await cargarMedidas();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      AlertService.error('Error', `No se pudo cambiar el estado de la medida ${medidaNombre || ''} (ID ${id}).`);
    } finally {
      setUpdatingId(null);
    }
  };

  const limpiarFormulario = () => {
    setNuevaMedida({ nombre: '', descripcion: '', activo: true });
    setEditandoMedida(null);
    setMostrarFormulario(false);
  };

  const verDetalles = (medida) => {
    setMedidaSeleccionada(medida);
    setMostrarDetalles(true);
  };

  // Filtrar medidas por fecha (ya que la búsqueda por texto se hace en el backend)
  const medidasFiltradas = effectiveMode === 'tallas'
    ? (medidas || []).filter(m => TALLAS_COMUNES.includes(String(m?.nombre || '').toUpperCase().trim()))
    : medidas;

  // Paginación
  const indiceUltimaMedida = paginaActual * medidasPorPagina;
  const indicePrimeraMedida = indiceUltimaMedida - medidasPorPagina;
  const medidasActuales = medidasFiltradas.slice(indicePrimeraMedida, indiceUltimaMedida);
  const totalPaginas = Math.ceil(medidasFiltradas.length / medidasPorPagina);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const limpiarFiltros = () => {
    // Función eliminada: no hay filtros de fecha
  };

  if (loading) {
    return <div className="loading">{effectiveMode === 'tallas' ? 'Cargando tallas...' : 'Cargando medidas...'}</div>;
  }

  return (
    <div className="medidas-container">
      {/* Header */}
      <div className="medidas-header">
        <div className="header-left">
          <h2>
            {effectiveMode === 'tallas' ? 'Tallas' : 'Gestión de Medidas'}
            <span className="contador-medidas">{medidasFiltradas.length}</span>
          </h2>
        </div>
        <div className="header-right">
          {/* Filtros de fecha eliminados */}
          <div className="acciones-globales">
            <div className="buscador">
              <input
                type="text"
                className="input-busqueda"
                placeholder={effectiveMode === 'tallas' ? 'Buscar tallas...' : 'Buscar medida...'}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <button onClick={() => setMostrarFormulario(true)} className="btn-agregar">
              {effectiveMode === 'tallas' ? '+ Agregar Talla' : '+ Agregar Medida'}
            </button>
            {/* Botón de "Agregar Tallas Comunes" eliminado */}
          </div>
        </div>
      </div>

      {/* Modal para agregar/editar medida */}
      <Dialog.Root open={mostrarFormulario} onOpenChange={setMostrarFormulario}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            <Dialog.Title className="dialog-title">
              {editandoMedida
                ? (effectiveMode === 'tallas' ? 'Editar Talla' : 'Editar Medida')
                : (effectiveMode === 'tallas' ? 'Formulario de agregar talla' : 'Formulario de agregar medida')}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="dialog-close-unified" aria-label="Cerrar">&times;</button>
            </Dialog.Close>
            
            <div className="dialog-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    {effectiveMode === 'tallas' ? 'Talla' : 'Nombre'} <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={nuevaMedida.nombre}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNuevaMedida({ ...nuevaMedida, nombre: val });
                      if ((val || '').trim() !== '') {
                        setErroresMedida(prev => ({ ...prev, nombre: '' }));
                      }
                    }}
                    onBlur={(e) => {
                      const val = (e.target.value || '').trim();
                      if (val === '') {
                        setErroresMedida(prev => ({ ...prev, nombre: 'El nombre es requerido.' }));
                      }
                    }}
                    placeholder={effectiveMode === 'tallas' ? 'Nombre de la talla' : 'Nombre de la medida'}
                    className={erroresMedida?.nombre ? 'error' : ''}
                  />
                  {erroresMedida?.nombre && (
                    <span className="error-mensaje">{erroresMedida.nombre}</span>
                  )}
                </div>
                {effectiveMode !== 'tallas' && (
                  <div className="form-group">
                    <label>Abreviatura</label>
                    <input
                      type="text"
                      value={nuevaMedida.abreviatura}
                      onChange={(e) => setNuevaMedida({ ...nuevaMedida, abreviatura: e.target.value })}
                      placeholder={'Abreviatura (ej: kg, cm, lt)'}
                      maxLength="10"
                    />
                  </div>
                )}
                <div className="form-group full-width">
                  <label>Descripción</label>
                  <input
                    type="text"
                    value={nuevaMedida.descripcion}
                    onChange={(e) => setNuevaMedida({ ...nuevaMedida, descripcion: e.target.value })}
                    placeholder={effectiveMode === 'tallas' ? 'Descripción de la talla' : 'Descripción de la medida'}
                  />
                </div>
              </div>
            </div>

            <div className="botones-formulario">
              <button 
                onClick={editandoMedida ? actualizarMedida : agregarMedida} 
                className="btn-guardar"
              >
                Crear marca
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal para ver detalles */}
      <Dialog.Root open={mostrarDetalles} onOpenChange={setMostrarDetalles}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            <Dialog.Title className="dialog-title">
              {effectiveMode === 'tallas' ? 'Detalles de la Talla' : 'Detalles de la Medida'}
            </Dialog.Title>
            
            {medidaSeleccionada && (
              <div className="detalles-medida-container">
                <div className="seccion-detalles">
                  <h3 className="titulo-seccion">Información General</h3>
                  <div className="detalles-contenido">
                    <div className="columna-izquierda">
                      <div className="detalle-grupo">
                        <label>{effectiveMode === 'tallas' ? 'Talla:' : 'Nombre:'}</label>
                        <span>{medidaSeleccionada.nombre}</span>
                      </div>
                      <div className="detalle-grupo">
                        {effectiveMode !== 'tallas' && (
                          <>
                            <label>Abreviatura:</label>
                            <span>{medidaSeleccionada.abreviatura || 'No especificada'}</span>
                          </>
                        )}
                      </div>
                      <div className="detalle-grupo">
                        <label>Descripción:</label>
                        <span>{medidaSeleccionada.descripcion || 'No especificada'}</span>
                      </div>
                    </div>
                    <div className="columna-derecha">
                      <div className="detalle-grupo">
                        <label>Estado:</label>
                        <span className={`estado-badge ${medidaSeleccionada.activo ? 'activo' : 'inactivo'}`}>
                          {medidaSeleccionada.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div className="detalle-grupo">
                        <label>Fecha de Registro:</label>
                        <span>{new Date(medidaSeleccionada.fechaRegistro).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="botones-formulario">
              <button 
                type="button" 
                onClick={() => setMostrarDetalles(false)}
                className="btn-cancelar"
              >
                Cerrar
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Tabla */}
      <div className="tabla-wrapper">
        <table className="tabla-medidas">
          <thead>
            <tr>
              <th>ID</th>
              <th>{effectiveMode === 'tallas' ? 'Talla' : 'Nombre'}</th>
              {effectiveMode !== 'tallas' && (<th>Abreviatura</th>)}
              <th>Descripción</th>
              <th>Estado</th>
              <th>Fecha Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {medidasActuales.length > 0 ? (
              medidasActuales.map((medida) => (
                <tr key={`medida-${medida.id || medida.idMedida}`} className={!medida.activo ? 'fila-anulada' : ''}>
                  <td>{medida.idMedida}</td>
                  <td>{medida.nombre}</td>
                  {effectiveMode !== 'tallas' && (<td>{medida.abreviatura || '-'}</td>)}
                  <td>{medida.descripcion || 'Sin descripción'}</td>
                  <td>
                    <button
                      onClick={() => cambiarEstado(medida.idMedida, !medida.activo)}
                      className={`estado ${medida.activo ? 'activo' : 'inactivo'}`}
                      disabled={loading || updatingId === medida.idMedida}
                      aria-busy={updatingId === medida.idMedida}
                    >
                      {medida.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td>{new Date(medida.fechaRegistro).toLocaleDateString()}</td>
                  <td>
                    <div className="acciones">
                      <button
                        onClick={() => verDetalles(medida)}
                        className="btn-icono ver"
                        title="Ver detalles"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => editarMedida(medida)}
                        className="btn-icono editar"
                        title="Editar"
                        disabled={!medida.activo || loading || updatingId === medida.idMedida}
                        aria-busy={updatingId === medida.idMedida}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor"/>
                          <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor"/>
                        </svg>
                      </button>
                      {effectiveMode !== 'tallas' && (
                        <button
                          onClick={() => eliminarMedida(medida.idMedida)}
                          className="btn-icono eliminar"
                          title="Eliminar"
                          disabled={!medida.activo || deletingId === medida.idMedida || loading}
                          aria-busy={deletingId === medida.idMedida}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={effectiveMode === 'tallas' ? 6 : 7} style={{ textAlign: 'center', padding: '2rem' }}>
                  {effectiveMode === 'tallas' ? 'No se encontraron tallas' : 'No se encontraron medidas'}
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
        itemsPerPage={medidasPorPagina}
        totalItems={medidasFiltradas.length}
        showInfo={true}
      />
    </div>
  );
};

export default MedidasTable;

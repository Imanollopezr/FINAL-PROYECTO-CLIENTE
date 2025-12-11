import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import marcasService from '../../services/marcasService';
import AlertService from '../shared/AlertService';
import Pagination from '../shared/Pagination';
import './MarcasTable.scss';

const MarcasTable = () => {
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [nuevaMarca, setNuevaMarca] = useState({
    nombre: '',
    descripcion: '',
    activo: true
  });
  
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoMarca, setEditandoMarca] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState(null);
  const [erroresMarca, setErroresMarca] = useState({});
  
  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [marcasPorPagina] = useState(5);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  
  // Estados para filtros de fecha
  // (Eliminados)

  // Función para cargar marcas desde la API
  const cargarMarcas = async () => {
    try {
      setLoading(true);
      const data = await marcasService.obtenerMarcas();
      setMarcas(data);
      // Ajuste de paginación si la página actual superó el total de páginas
      const totalPaginasData = Math.ceil((data?.length || 0) / marcasPorPagina);
      if (paginaActual > totalPaginasData && totalPaginasData >= 1) {
        setPaginaActual(totalPaginasData);
      }
    } catch (error) {
      console.error('Error al cargar marcas:', error);
      AlertService.error('Error', 'No se pudieron cargar las marcas');
    } finally {
      setLoading(false);
    }
  };

  // Función para buscar marcas
  const buscarMarcas = async (termino) => {
    if (!termino.trim()) {
      cargarMarcas();
      return;
    }

    try {
      setLoading(true);
      const data = await marcasService.buscarMarcas(termino);
      setMarcas(data);
    } catch (error) {
      console.error('Error al buscar marcas:', error);
      AlertService.error('Error', 'No se pudieron buscar las marcas');
    } finally {
      setLoading(false);
    }
  };

  // Efecto para búsqueda con debounce (evitar ejecución en el primer render)
  const firstSearchRef = useRef(true);
  useEffect(() => {
    if (firstSearchRef.current) {
      firstSearchRef.current = false;
      return; // Evita doble carga inicial (StrictMode/efecto de montaje)
    }
    const timeoutId = setTimeout(() => {
      if (busqueda.trim()) {
        buscarMarcas(busqueda);
      } else {
        cargarMarcas();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [busqueda]);

  useEffect(() => {
    cargarMarcas();
  }, []);

  const validarMarca = (marca) => {
    return marca.nombre?.trim() !== '';
  };

  const agregarMarca = async () => {
    if (!validarMarca(nuevaMarca)) {
      return AlertService.warning('Campos incompletos', 'El nombre de la marca es requerido.');
    }

    try {
      await marcasService.crearMarca({ ...nuevaMarca, activo: true });
      AlertService.success('Marca agregada', 'La marca se agregó correctamente.');
      setNuevaMarca({ nombre: '', descripcion: '', activo: true });
      setMostrarFormulario(false);
      cargarMarcas();
    } catch (error) {
      console.error('Error al agregar marca:', error);
      AlertService.error('Error', 'No se pudo agregar la marca.');
    }
  };

  const editarMarca = (marca) => {
    if (marca && marca.activo === false) {
      AlertService.info('Marca inactiva', 'No puedes editar una marca inactiva. Actívala para continuar.');
      return;
    }
    setEditandoMarca(marca);
    setNuevaMarca({
      nombre: marca.nombre,
      descripcion: marca.descripcion || '',
      activo: marca.activo
    });
    setMostrarFormulario(true);
  };

  const actualizarMarca = async () => {
    if (!validarMarca(nuevaMarca)) {
      return AlertService.warning('Campos incompletos', 'El nombre de la marca es requerido.');
    }

    try {
      await marcasService.actualizarMarca(editandoMarca.idMarca, nuevaMarca);
      AlertService.success('Marca actualizada', 'La marca se actualizó correctamente.');
      setNuevaMarca({ nombre: '', descripcion: '', activo: true });
      setMostrarFormulario(false);
      setEditandoMarca(null);
      cargarMarcas();
    } catch (error) {
      console.error('Error al actualizar marca:', error);
      AlertService.error('Error', 'No se pudo actualizar la marca.');
    }
  };

  const eliminarMarca = async (id) => {
    if (deletingId) return;
    const marca = marcas.find(m => m.idMarca === id);
    const marcaNombre = (marca?.nombre) || '';
    const result = await AlertService.confirmDelete('¿Eliminar marca?', marcaNombre ? `Se eliminará la marca ${marcaNombre} (ID ${id}).` : 'Esta acción no se puede deshacer');

    if (result.isConfirmed) {
      try {
        setDeletingId(id);
        await marcasService.eliminarMarca(id);
        AlertService.success('Marca eliminada', `La marca ${marcaNombre || ''} (ID ${id}) se eliminó correctamente.`);
        setMarcas(prev => (prev || []).filter(m => (m.idMarca ?? m.id) !== id));
        // Si la página queda vacía tras eliminar, retroceder una página
        const indiceUltimaMarcaPost = paginaActual * marcasPorPagina;
        const indicePrimeraMarcaPost = indiceUltimaMarcaPost - marcasPorPagina;
        const marcasActualesPost = ((marcas || []).filter(m => (m.idMarca ?? m.id) !== id)).slice(indicePrimeraMarcaPost, indiceUltimaMarcaPost);
        if (marcasActualesPost.length === 0 && paginaActual > 1) {
          setPaginaActual(paginaActual - 1);
        }
      } catch (error) {
        console.error('Error al eliminar marca:', error);
        const errorMessage = error.message || 'No se pudo eliminar la marca.';
        AlertService.error('Error al eliminar', errorMessage);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    const marcaNombre = (marcas.find(m => m.idMarca === id)?.nombre) || '';
    try {
      setUpdatingId(id);
      await marcasService.cambiarEstadoMarca(id, nuevoEstado);
      AlertService.success('Estado actualizado', `La marca ${marcaNombre || ''} (ID ${id}) se ${nuevoEstado ? 'activó' : 'desactivó'} correctamente.`);
      await cargarMarcas();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      AlertService.error('Error', `No se pudo cambiar el estado de la marca ${marcaNombre || ''} (ID ${id}).`);
    } finally {
      setUpdatingId(null);
    }
  };

  const limpiarFormulario = () => {
    setNuevaMarca({ nombre: '', descripcion: '', activo: true });
    setEditandoMarca(null);
    setMostrarFormulario(false);
  };

  const verDetalles = (marca) => {
    setMarcaSeleccionada(marca);
    setMostrarDetalles(true);
  };

  // Filtrar marcas por fecha (ya que la búsqueda por texto se hace en el backend)
  const marcasFiltradas = marcas;

  // Paginación
  const indiceUltimaMarca = paginaActual * marcasPorPagina;
  const indicePrimeraMarca = indiceUltimaMarca - marcasPorPagina;
  const marcasActuales = marcasFiltradas.slice(indicePrimeraMarca, indiceUltimaMarca);
  const totalPaginas = Math.ceil(marcasFiltradas.length / marcasPorPagina);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const limpiarFiltros = () => {
    // Función eliminada: no hay filtros de fecha
  };

  if (loading) {
    return <div className="loading">Cargando marcas...</div>;
  }

  return (
    <div className="marcas-container">
      {/* Header */}
      <div className="marcas-header">
        <div className="header-left">
          <h2>
            Gestión de Marcas
            <span className="contador-marcas">{marcasFiltradas.length}</span>
          </h2>
        </div>
        <div className="header-right">
          {/* Filtros de fecha eliminados */}
          <div className="acciones-globales">
            <div className="buscador">
              <input
                type="text"
                className="input-busqueda"
                placeholder="Buscar marcas..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <button onClick={() => setMostrarFormulario(true)} className="btn-agregar">
              Agregar Marca
            </button>
          </div>
        </div>
      </div>

      {/* Modal para agregar/editar marca */}
      <Dialog.Root open={mostrarFormulario} onOpenChange={setMostrarFormulario}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            <Dialog.Title className="dialog-title">
              {editandoMarca ? 'Editar Marca' : 'Formulario de agregar marca'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="dialog-close-unified" aria-label="Cerrar">&times;</button>
            </Dialog.Close>
            
            <div className="dialog-form formulario-vertical">
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Nombre <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={nuevaMarca.nombre}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNuevaMarca({ ...nuevaMarca, nombre: val });
                      if ((val || '').trim() !== '') {
                        setErroresMarca(prev => ({ ...prev, nombre: '' }));
                      }
                    }}
                    onBlur={(e) => {
                      const val = (e.target.value || '').trim();
                      if (val === '') {
                        setErroresMarca(prev => ({ ...prev, nombre: 'El nombre es requerido.' }));
                      }
                    }}
                    placeholder="Nombre de la marca"
                    className={erroresMarca?.nombre ? 'error' : ''}
                  />
                  {erroresMarca?.nombre && (
                    <span className="error-mensaje">{erroresMarca.nombre}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <input
                    type="text"
                    value={nuevaMarca.descripcion}
                    onChange={(e) => setNuevaMarca({ ...nuevaMarca, descripcion: e.target.value })}
                    placeholder="Descripción de la marca"
                  />
                </div>
                {/* Campo Estado removido en edición; el estado se gestiona desde el botón externo en la tabla */}
              </div>
            </div>

            <div className="dialog-actions-centrado">
              <button 
                onClick={editandoMarca ? actualizarMarca : agregarMarca} 
                className="btn btn-confirmar"
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
              Detalles de la Marca
            </Dialog.Title>
            
            {marcaSeleccionada && (
              <div className="detalles-marca-container">
                <div className="seccion-detalles">
                  <h3 className="titulo-seccion">Información General</h3>
                  <div className="detalles-contenido">
                    <div className="columna-izquierda">
                      <div className="detalle-grupo">
                        <label>Nombre:</label>
                        <span>{marcaSeleccionada.nombre}</span>
                      </div>
                      <div className="detalle-grupo">
                        <label>Descripción:</label>
                        <span>{marcaSeleccionada.descripcion || 'No especificada'}</span>
                      </div>
                    </div>
                    <div className="columna-derecha">
                      <div className="detalle-grupo">
                        <label>Estado:</label>
                        <span className={`estado-badge ${marcaSeleccionada.activo ? 'activo' : 'inactivo'}`}>
                          {marcaSeleccionada.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div className="detalle-grupo">
                        <label>Fecha de Registro:</label>
                        <span>{new Date(marcaSeleccionada.fechaRegistro).toLocaleDateString()}</span>
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
        <table className="tabla-marcas">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Fecha Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {marcasActuales.length > 0 ? (
              marcasActuales.map((marca) => (
                <tr key={`marca-${marca.idMarca || marca.id}`} className={!marca.activo ? 'fila-anulada' : ''}>
                  <td>{marca.idMarca}</td>
                  <td>{marca.nombre}</td>
                  <td>{marca.descripcion || 'Sin descripción'}</td>
                  <td>
                    <button
                      onClick={() => cambiarEstado(marca.idMarca, !marca.activo)}
                      className={`estado ${marca.activo ? 'activo' : 'inactivo'}`}
                      disabled={loading || updatingId === marca.idMarca}
                      aria-busy={updatingId === marca.idMarca}
                    >
                      {marca.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td>{new Date(marca.fechaRegistro).toLocaleDateString()}</td>
                  <td>
                    <div className="acciones">
                      <button
                        onClick={() => verDetalles(marca)}
                        className="btn-icono ver"
                        title="Ver detalles"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => editarMarca(marca)}
                        className="btn-icono editar"
                        title="Editar"
                        disabled={!marca.activo || loading || updatingId === marca.idMarca}
                        aria-busy={updatingId === marca.idMarca}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor"/>
                          <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => eliminarMarca(marca.idMarca)}
                        className="btn-icono eliminar"
                        title="Eliminar"
                        disabled={!marca.activo || deletingId === marca.idMarca || loading}
                        aria-busy={deletingId === marca.idMarca}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                  No se encontraron marcas
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
        itemsPerPage={marcasPorPagina}
        totalItems={marcasFiltradas.length}
        showInfo={true}
      />
    </div>
  );
};

export default MarcasTable;

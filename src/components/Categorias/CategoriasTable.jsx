import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Swal from "sweetalert2";
import { API_BASE_URL, API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from "../../constants/apiConstants";
import { getToken as getStoreToken } from '../../features/auth/tokenStore';
import Pagination from "../shared/Pagination";
import "./CategoriasTable.scss";
import { isValidCssColor } from "../../shared/utils/colorUtils";
import { normalizeText } from "../../shared/utils/textUtils";
import { useCancelableFetch } from "../../shared/hooks/useCancelableFetch";

const CategoriasTable = ({ mode = 'categorias' }) => {
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: '', descripcion: '' });
  const [editando, setEditando] = useState(null);
  const [open, setOpen] = useState(false);
  const [modalDetalles, setModalDetalles] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [categoriasPorPagina] = useState(5);

  const { request } = useCancelableFetch();

  useEffect(() => {
    // Al cambiar de modo, resetear búsqueda y paginación
    setBusqueda('');
    setPaginaActual(1);
    cargarCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const cargarCategorias = async () => {
    setLoading(true);
    try {
      const endpoint = mode === 'colores'
        ? `${API_ENDPOINTS.COLORES.GET_ALL}?includeInactive=true`
        : API_ENDPOINTS.CATEGORIAS.GET_ALL;
      const response = await request(buildApiUrl(endpoint), {
        method: 'GET',
        headers: DEFAULT_HEADERS
      });
      if (response.ok) {
        const data = await response.json();
        if (mode === 'colores') {
          const list = (Array.isArray(data) ? data : []).map((d) => ({
            idColor: d?.idColor ?? d?.IdColor ?? d?.id,
            nombre: d?.nombre ?? d?.Nombre ?? '',
            descripcion: d?.codigo ?? d?.Codigo ?? d?.descripcion ?? '',
            activo: (d?.activo ?? d?.Activo) !== false,
            fechaRegistro: d?.fechaRegistro ?? d?.FechaRegistro
          }));
          setCategorias(list);
        } else {
          setCategorias(Array.isArray(data) ? data : []);
        }
      } else {
        throw new Error('Error al cargar categorías');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: mode === 'colores' ? 'No se pudieron cargar los colores' : 'No se pudieron cargar las categorías',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
      }
    } finally {
      setLoading(false);
    }
  };

  


  const esEntradaColor = (c) => {
    return isValidCssColor(c?.descripcion);
  };

  const baseCategorias = (() => {
    if (mode === 'colores') return categorias.filter(esEntradaColor);
    return categorias.filter(c => !esEntradaColor(c));
  })();

  const categoriasFiltradas = baseCategorias.filter((c) => {
    const termino = normalizeText(busqueda);
    if (!termino) return true;
    const campos = [
      c.nombre,
      c.descripcion,
      c.idCategoriaProducto,
      c.activo ? 'activo' : 'inactivo'
    ];
    return campos.some((valor) => normalizeText(valor).includes(termino));
  });

  // Paginación
  const indiceUltimaCategoria = paginaActual * categoriasPorPagina;
  const indicePrimeraCategoria = indiceUltimaCategoria - categoriasPorPagina;
  const categoriasActuales = categoriasFiltradas.slice(indicePrimeraCategoria, indiceUltimaCategoria);
  const totalPaginas = Math.ceil(categoriasFiltradas.length / categoriasPorPagina);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };



  const handleAgregar = async (e) => {
    e.preventDefault();
    
    if (!nuevaCategoria.nombre.trim() || !nuevaCategoria.descripcion.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Completa todos los campos',
        showConfirmButton: false,
        timer: 1000,
        timerProgressBar: true
      });
      return;
    }
    if (mode === 'colores') {
      if (!isValidCssColor(nuevaCategoria.descripcion)) {
        Swal.fire({
          icon: 'warning',
          title: 'Código inválido',
          text: 'Usa un color CSS válido (ej: #FF0000, rgb(255,0,0), hsl(0,100%,50%))',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true
        });
        return;
      }
    }
    
    setLoading(true);
    try {
      // Seleccionar endpoint según el modo
      const base = mode === 'colores' ? '/api/colores' : '/api/categorias';
      if (editando) {
        // Actualizar
        const editId = (editando.idColor ?? editando.id ?? editando.idCategoriaProducto);
        const token = getStoreToken();
        const headers = token ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` } : { ...DEFAULT_HEADERS };
        const response = await fetch(buildApiUrl(`${base}/${editId}`), {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify(
            mode === 'colores'
              ? { Nombre: nuevaCategoria.nombre, Codigo: nuevaCategoria.descripcion, Activo: editando.activo }
              : { Nombre: nuevaCategoria.nombre, Descripcion: nuevaCategoria.descripcion }
          )
        });
        
        if (response.ok) {
          await cargarCategorias();
          Swal.fire({
            icon: 'success',
            title: mode === 'colores' ? 'Color actualizado' : 'Categoría actualizada',
            text: mode === 'colores' ? 'El color fue editado correctamente' : 'La categoría fue editada correctamente',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          });
          setEditando(null);
        } else {
          const errorData = await response.text();
          console.error('Error response:', response.status, errorData);
          throw new Error(`Error al actualizar ${mode === 'colores' ? 'color' : 'categoría'}: ${response.status} - ${errorData}`);
        }
      } else {
        // Crear
        const token = getStoreToken();
        const headers = token ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` } : { ...DEFAULT_HEADERS };
        const response = await fetch(buildApiUrl(base), {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(
            mode === 'colores'
              ? { Nombre: nuevaCategoria.nombre, Codigo: nuevaCategoria.descripcion, Activo: true }
              : { Nombre: nuevaCategoria.nombre, Descripcion: nuevaCategoria.descripcion }
          )
        });
        
        if (response.ok) {
          await cargarCategorias();
          Swal.fire({
            icon: 'success',
            title: mode === 'colores' ? 'Color creado' : 'Categoría creada',
            text: mode === 'colores' ? 'El nuevo color fue registrado exitosamente' : 'La nueva categoría fue registrada exitosamente',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          });
        } else {
          const errorData = await response.text();
          console.error('Error response:', response.status, errorData);
          throw new Error(`Error al crear ${mode === 'colores' ? 'color' : 'categoría'}: ${response.status} - ${errorData}`);
        }
      }
      
      setNuevaCategoria({ nombre: '', descripcion: '' });
      setOpen(false);
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: editando ? (mode === 'colores' ? 'No se pudo actualizar el color' : 'No se pudo actualizar la categoría') : (mode === 'colores' ? 'No se pudo crear el color' : 'No se pudo crear la categoría'),
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
    } finally {
      setLoading(false);
    }
  };
  

  const editarCategoria = (categoria) => {
    if (!categoria?.activo) {
      Swal.fire({
        icon: 'info',
        title: 'Categoría inactiva',
        text: mode === 'colores' ? 'No puedes editar un color inactivo. Actívalo para continuar.' : 'No puedes editar una categoría inactiva. Actívala para continuar.',
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }
    setNuevaCategoria({ nombre: categoria.nombre, descripcion: categoria.descripcion });
    setEditando(categoria);
    setOpen(true);
  };

  const eliminarCategoria = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: mode === 'colores' ? 'Esta acción no se puede deshacer. Si el color tiene productos activos asociados no podrá eliminarse.' : 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        // Seleccionar endpoint según el modo
        const base = mode === 'colores' ? '/api/colores' : '/api/categorias';
        const token = getStoreToken();
        const headers = token ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` } : { ...DEFAULT_HEADERS };
        const response = await fetch(buildApiUrl(`${base}/${id}`), {
          method: 'DELETE',
          headers,
          credentials: 'include'
        });
        
        if (response.ok) {
          setCategorias(prev => (prev || []).filter(c => ((c.idCategoriaProducto ?? c.idColor ?? c.id) !== id)));
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: mode === 'colores' ? 'Color eliminado correctamente' : 'Categoría eliminada correctamente',
            timer: 1800,
            showConfirmButton: false
          });
        } else if (response.status === 409 && mode === 'colores') {
          const errText = await response.text().catch(() => '');
          Swal.fire({
            icon: 'warning',
            title: 'No se puede eliminar',
            text: errText || 'No se puede eliminar: tiene productos activos asociados',
            timer: 2800,
            showConfirmButton: false
          });
        } else {
          const errText = await response.text().catch(() => '');
          throw new Error(`Error ${response.status}: ${errText || response.statusText}`);
        }
      } catch (error) {
        console.error('Error al eliminar categoría:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: mode === 'colores' ? 'No se pudo eliminar el color' : 'No se pudo eliminar la categoría',
          timer: 2800,
          showConfirmButton: false
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    const result = await Swal.fire({
      title: nuevoEstado ? (mode === 'colores' ? '¿Activar color?' : '¿Activar categoría?') : (mode === 'colores' ? '¿Desactivar color?' : '¿Desactivar categoría?'),
      text: nuevoEstado ? 'Se habilitará para su uso' : 'Se ocultará y no estará disponible',
      icon: nuevoEstado ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: nuevoEstado ? 'Sí, activar' : 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: nuevoEstado ? '#2d5a27' : '#d33',
      cancelButtonColor: '#3085d6'
    });
    if (!result.isConfirmed) return;
    setLoading(true);
    try {
      const baseEstado = mode === 'colores' ? `/api/colores/${id}/estado` : `/api/categorias/${id}/estado`;
      const token = getStoreToken();
      const headers = token ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` } : { ...DEFAULT_HEADERS };
      const response = await fetch(buildApiUrl(baseEstado), {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ activo: nuevoEstado })
      });
      if (response.ok) {
        await cargarCategorias();
        Swal.fire({
          icon: 'success',
          title: nuevoEstado ? (mode === 'colores' ? 'Color activado' : 'Categoría activada') : (mode === 'colores' ? 'Color desactivado' : 'Categoría desactivada'),
          text: `${mode === 'colores' ? 'El color' : 'La categoría'} ha sido ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`,
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true
        });
      } else {
        const errTxt = await response.text().catch(() => '');
        throw new Error(`Error al cambiar estado (${response.status}): ${errTxt}`);
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mode === 'colores' ? 'No se pudo cambiar el estado del color' : 'No se pudo cambiar el estado de la categoría',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="categorias-container">
      <div className="categorias-header">
        <div className="header-left">
          <h2>{mode === 'colores' ? 'COLORES' : 'CATEGORIA DE PRODUCTOS'} <span className="contador-categorias">({categoriasFiltradas.length})</span></h2>
        </div>
        <div className="header-right">
          <input
            type="text"
            className="input-busqueda"
            placeholder={mode === 'colores' ? 'Buscar color...' : 'Buscar categoría...'}
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button className="btn btn-agregar" onClick={() => {
                setEditando(null);
                setNuevaCategoria({ nombre: '', descripcion: '' });
                setOpen(true);
              }}>
               {mode === 'colores' ? 'Agregar Color' : 'Agregar Categoría'}
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
            <Dialog.Overlay className="dialog-overlay" />
            <Dialog.Content className="dialog-content">
              <form onSubmit={handleAgregar}>
              <Dialog.Close asChild>
                <button type="button" className="dialog-close-unified" aria-label="Cerrar">&times;</button>
              </Dialog.Close>

              <Dialog.Title className="dialog-title">
                {editando
                  ? (mode === 'colores' ? 'Editar Color' : 'Editar Categoría')
                  : (mode === 'colores' ? 'Formulario de agregar color' : 'Formulario de agregar categoría')}
              </Dialog.Title>
              <div className="formulario-unico">
                  <div className="grupo-campo">
                    <label htmlFor="nombre">{mode === 'colores' ? 'Color' : 'Nombre'} <span className="requerido">*</span></label>
                    <input
                      id="nombre"
                      type="text"
                      placeholder={mode === 'colores' ? 'Ingrese el nombre del color' : 'Ingrese el nombre de la categoría'}
                      value={nuevaCategoria.nombre}
                      onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, nombre: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="grupo-campo">
                    <label htmlFor="descripcion">{mode === 'colores' ? 'Código' : 'Descripción'} <span className="requerido">*</span></label>
                    <input
                      id="descripcion"
                      type="text"
                      placeholder={mode === 'colores' ? 'Ej: #FF0000, rgb(255,0,0), hsl(0,100%,50%)' : 'Ingrese la descripción de la categoría'}
                      value={nuevaCategoria.descripcion}
                      onChange={e => setNuevaCategoria({ ...nuevaCategoria, descripcion: e.target.value })}
                      required
                      disabled={editando && mode === 'colores'}
                    />
                  </div>
                  {mode === 'colores' && (
                    <div className="grupo-campo">
                      <label htmlFor="colorpicker">Selecciona color</label>
                      <input
                        id="colorpicker"
                        type="color"
                        value={/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(nuevaCategoria.descripcion) ? nuevaCategoria.descripcion : '#000000'}
                        onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, descripcion: e.target.value })}
                        disabled={editando && mode === 'colores'}
                      />
                    </div>
                  )}
                </div>

                <div className="dialog-actions-centrado">
                  <button type="submit" className="btn btn-confirmar" disabled={loading}>
                    {loading ? 'Procesando...' : (editando ? (mode === 'colores' ? 'Actualizar Color' : 'Actualizar Categoría') : (mode === 'colores' ? 'Agregar Color' : 'Agregar Categoría'))}
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
          </div>
        </div>

      <div className="tabla-wrapper">
        <table className={`tabla-categorias ${mode === 'colores' ? 'tabla-colores' : ''}`}>
          <thead>
            <tr>
              <th>{mode === 'colores' ? 'Color' : 'Nombre'}</th>
              <th>{mode === 'colores' ? 'Código' : 'Descripción'}</th>
              {mode === 'colores' && (<th className="columna-muestra">Muestra</th>)}
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && categorias.length === 0 ? (
              <tr>
                <td colSpan={mode === 'colores' ? 5 : 4} className="sin-resultados">{mode === 'colores' ? 'Cargando colores...' : 'Cargando categorías...'}</td>
              </tr>
            ) : (
              categoriasActuales.map(c => (
                <tr key={(c.idCategoriaProducto ?? c.idColor ?? c.id ?? `${c.nombre}-${c.descripcion}`)} className={!c.activo ? 'fila-anulada' : ''}>
                  <td>{c.nombre}</td>
                  <td className={mode === 'colores' ? 'columna-codigo' : undefined}>
                    <span>{c.descripcion}</span>
                  </td>
              {mode === 'colores' && (
                <td className="columna-muestra">
                  {isValidCssColor(c.descripcion) ? (
                    <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: c.descripcion }} />
                  ) : (
                    <span>—</span>
                  )}
                </td>
              )}
              <td>
                <button
                  type="button"
                  className={`estado-badge ${c.activo ? 'activo' : 'inactivo'}`}
                  title={c.activo ? 'Clic para desactivar' : 'Clic para activar'}
                  onClick={() => cambiarEstado((c.idCategoriaProducto ?? c.idColor ?? c.id), !c.activo)}
                  disabled={loading}
                  style={{ cursor: 'pointer' }}
                >
                  {c.activo ? 'Activo' : 'Inactivo'}
                </button>
              </td>
              <td className="acciones">
                <button onClick={() => {
                  setModalDetalles(c);
                }} className="btn-icono btn-detalles" title="Ver Detalles" disabled={loading}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#6b7280"/>
                      </svg>
                    </button>
                    <button onClick={() => editarCategoria(c)} className="btn-icono btn-editar" title="Editar" disabled={!c.activo || loading}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#000000"/>
                      </svg>
                    </button>
                    <button onClick={() => eliminarCategoria((c.idCategoriaProducto ?? c.idColor ?? c.id))} className="btn-icono btn-eliminar" title="Eliminar" disabled={loading}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#dc2626"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
            {categoriasFiltradas.length === 0 && (
              <tr>
                <td colSpan={mode === 'colores' ? 5 : 4} className="sin-resultados">{mode === 'colores' ? 'No se encontraron colores.' : 'No se encontraron categorías.'}</td>
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
        itemsPerPage={categoriasPorPagina}
        totalItems={categoriasFiltradas.length}
        showInfo={true}
      />

      {/* Modal Detalles */}
      <Dialog.Root open={!!modalDetalles} onOpenChange={() => setModalDetalles(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content dialog-detalles">
            <Dialog.Close asChild>
              <button className="dialog-close-unified" aria-label="Cerrar">&times;</button>
            </Dialog.Close>
            
            <Dialog.Title className="modal-titulo-base">
              {mode === 'colores' ? 'Detalles del Color' : 'Detalles de la Categoría'}
            </Dialog.Title>
            <Dialog.Description className="dialog-description">
              {mode === 'colores' ? 'Información completa del color seleccionado' : 'Información completa de la categoría seleccionada'}
            </Dialog.Description>
            
            {modalDetalles && (
              <>
                <div className="seccion-detalles-base">
                  <h3 className="titulo-seccion-base">{mode === 'colores' ? 'Información del Color' : 'Información de la Categoría'}</h3>
                  <div className="formulario-dos-columnas-base">
                    <div className="detalle-grupo-base">
                      <label>{mode === 'colores' ? 'Color:' : 'Nombre:'}</label>
                      <span>{modalDetalles.nombre}</span>
                    </div>
                    <div className="detalle-grupo-base">
                      <label>{mode === 'colores' ? 'Código:' : 'Descripción:'}</label>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        {modalDetalles.descripcion}
                        {mode === 'colores' && isValidCssColor(modalDetalles.descripcion) && (
                          <span style={{ display: 'inline-block', width: '18px', height: '18px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: modalDetalles.descripcion }} />
                        )}
                      </span>
                    </div>
                    <div className="detalle-grupo-base">
                      <label>Estado:</label>
                      <span className={`estado-badge ${modalDetalles.activo ? 'activo' : 'inactivo'}`}>
                        {modalDetalles.activo ? "Activo" : "Inactivo"}
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

export default CategoriasTable;

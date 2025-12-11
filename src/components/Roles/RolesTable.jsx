import React, { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Swal from "sweetalert2";
import RolesService from '../../services/rolesService';
import PermisosService from '../../services/permisosService';
import { API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '../../constants/apiConstants';
import Pagination from '../shared/Pagination';
import "./RolesTable.scss";

const RolesTable = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [permisoBusqueda, setPermisoBusqueda] = useState("");
  const [nuevo, setNuevo] = useState({ nombre: "", descripcion: "", permisos: [], activo: true });
  const [editando, setEditando] = useState(null);
  const [modalAgregar, setModalAgregar] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalDetalles, setModalDetalles] = useState(null);
  const [paginaPermisos, setPaginaPermisos] = useState(1);
  const [permisosDisponibles, setPermisosDisponibles] = useState([]);
  const [permisoNameToId, setPermisoNameToId] = useState({});
  
  // Utilidad: normalizar permisos (acepta strings u objetos)
  const mapPermisosNombres = (arr) => (
    Array.isArray(arr)
      ? arr
          .map(p => typeof p === 'string' ? p : (p?.nombre ?? p?.Nombre ?? ''))
          .filter(Boolean)
      : []
  );
  
  // Estados para paginación de roles
  const [paginaActual, setPaginaActual] = useState(1);
  const [rolesPorPagina] = useState(5);
  const [activeTab, setActiveTab] = useState('basica');
  const dialogContentRef = useRef(null);
  const backToTop = () => {
    try { dialogContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
  };
  const [categoriaLoadCount, setCategoriaLoadCount] = useState({});
  const categoriaLoadCountRef = useRef({});
  useEffect(() => { categoriaLoadCountRef.current = categoriaLoadCount; }, [categoriaLoadCount]);

  // Instancia del servicio
  const rolesService = RolesService;

  // Utilidad para mostrar mensajes HTTP claros según status
  const mostrarErrorHttp = (error, mensajePorDefecto) => {
    let texto = error?.message || mensajePorDefecto || 'Ocurrió un error inesperado';
    // Mejorar mensaje para errores de conexión / proxy
    if (!error?.status && (error?.name === 'TypeError' || /ECONNREFUSED|ERR_CONNECTION|ERR_ABORTED/i.test(String(error)))) {
      texto = 'No se pudo conectar con el servidor. Verifica que la API esté encendida.';
    }
    Swal.fire({
      icon: 'error',
      title: (error?.status === 401 || error?.status === 403) ? 'Acceso' : 'Error',
      text: texto
    });
  };

  // Función para cargar roles desde la API
  const cargarRoles = async () => {
    setLoading(true);
    try {
      // Preferir endpoint con permisos incluidos
      const data = await rolesService.obtenerRolesConPermisos?.()
        .catch(() => rolesService.obtenerRoles());
      console.log('Datos recibidos de la API:', data);
      // Mapear los datos para que coincidan con el frontend
      const rolesFormateados = data.map(rol => ({
        ...rol,
        nombre: rol.nombreRol || rol.nombre,
        permisos: mapPermisosNombres(rol.permisos)
      }));
      setRoles(rolesFormateados);
    } catch (error) {
      console.error('Error al cargar roles:', error);
      mostrarErrorHttp(error, 'No se pudieron cargar los roles');
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar permisos disponibles desde la API
  const cargarPermisos = async () => {
    try {
      const permisos = await PermisosService.obtenerPermisos();
      const objetos = (permisos || [])
        .map(p => ({ id: p.id || p.Id, nombre: p.nombre || p.Nombre }))
        .filter(p => p.id && p.nombre);
      const nombres = objetos.map(p => p.nombre).sort((a, b) => a.localeCompare(b));
      const nameToId = objetos.reduce((acc, p) => { acc[p.nombre] = p.id; return acc; }, {});
      setPermisosDisponibles(nombres);
      setPermisoNameToId(nameToId);
    } catch (error) {
      console.error('Error al cargar permisos:', error);
      setPermisosDisponibles([]);
      mostrarErrorHttp(error, 'No se pudieron cargar los permisos');
    }
  };

  // Cargar roles al montar el componente
  useEffect(() => {
    cargarRoles();
    cargarPermisos();
  }, []);

  // Función para resetear el formulario
  const resetearFormulario = () => {
    setNuevo({ nombre: "", descripcion: "", permisos: [], activo: true });
    setEditando(null);
    setPaginaPermisos(1);
  };

  // Función para abrir modal de agregar
  const abrirModalAgregar = () => {
    resetearFormulario();
    setModalEditar(false);
    setModalDetalles(null);
    setModalAgregar(true);
  };

  // Función para abrir modal de editar
  const abrirModalEditar = (rol) => {
    resetearFormulario();
    setNuevo({
      nombre: rol.nombreRol || rol.nombre,
      descripcion: rol.descripcion,
      permisos: mapPermisosNombres(rol.permisos),
      activo: rol.activo !== undefined ? rol.activo : true
    });
    setEditando(rol);
    setModalAgregar(false);
    setModalDetalles(null);
    setModalEditar(true);
    setPaginaPermisos(1);
  };

  // Función para cerrar modales
  const cerrarModales = () => {
    setModalAgregar(false);
    setModalEditar(false);
    resetearFormulario();
  };

  // Lista dinámica de permisos cargada desde backend

  const toggleEstadoRol = async (id) => {
    setLoading(true);
    try {
      const rol = roles.find(r => r.id === id);
      const nuevoEstado = !rol.activo;
      await rolesService.actualizarRol(id, {
        id,
        nombreRol: rol.nombreRol || rol.nombre,
        descripcion: rol.descripcion,
        activo: nuevoEstado
      });
      await cargarRoles();
      Swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        text: `El rol ha sido ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      mostrarErrorHttp(error, 'No se pudo cambiar el estado del rol');
    } finally {
      setLoading(false);
    }
  };

  const togglePermiso = (permiso) => {
    setNuevo((prev) => ({
      ...prev,
      permisos: prev.permisos.includes(permiso)
        ? prev.permisos.filter((p) => p !== permiso)
        : [...prev.permisos, permiso],
    }));
  };

  const categorizePermisos = (nombres) => {
    const cats = {
      Acceso: [],
      Gestion: [],
      Operaciones: [],
      Catalogo: [],
      Reportes: []
    };
    (nombres || []).forEach((name) => {
      const n = String(name || '').toLowerCase();
      if (/(roles|usuarios|acceso|micuenta|verdashboard)/.test(n)) cats.Acceso.push(name);
      else if (/gestion(clientes|proveedores|marcas|categorias|medidas|tallas|colores)/.test(n)) cats.Gestion.push(name);
      else if (/gestion(ventas|compras)|venta|compra/.test(n)) cats.Operaciones.push(name);
      else if (/productos|catalogo/.test(n)) cats.Catalogo.push(name);
      else cats.Reportes.push(name);
    });
    return cats;
  };

  const [categoriasAbiertas, setCategoriasAbiertas] = useState({ Acceso: true, Gestion: true, Operaciones: true, Catalogo: true, Reportes: false });
  const toggleCategoriaOpen = (cat) => setCategoriasAbiertas(prev => ({ ...prev, [cat]: !prev[cat] }));
  const toggleCategoriaAll = (cat, lista) => {
    const actuales = new Set(nuevo.permisos);
    const todosSeleccionados = lista.every(p => actuales.has(p));
    const nuevos = new Set(nuevo.permisos);
    if (todosSeleccionados) {
      lista.forEach(p => nuevos.delete(p));
    } else {
      lista.forEach(p => nuevos.add(p));
    }
    setNuevo(prev => ({ ...prev, permisos: Array.from(nuevos) }));
  };
  const setOnlyCategoriaOpen = (cat) => {
    setCategoriasAbiertas({ Acceso: false, Gestion: false, Operaciones: false, Catalogo: false, Reportes: false, [cat]: true });
  };

  const handleAgregar = async () => {
    if (!nuevo.nombre.trim() || !nuevo.descripcion.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Debes completar el nombre y la descripción del rol.",
        confirmButtonColor: "#ffc600",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    setLoading(true);
    try {
      if (editando) {
        await rolesService.actualizarRol(editando.id, {
          id: editando.id,
          nombreRol: nuevo.nombre,
          descripcion: nuevo.descripcion,
          activo: nuevo.activo
        });
        const rolId = editando.id || editando.Id;
        const antes = mapPermisosNombres(editando.permisos);
        const despues = mapPermisosNombres(nuevo.permisos);
        const porAsignar = despues.filter(p => !antes.includes(p));
        const porRemover = antes.filter(p => !despues.includes(p));

        // Ejecutar asignaciones y remociones en paralelo
        await Promise.all([
          ...porAsignar.map(nombre => {
            const permisoId = permisoNameToId[nombre];
            if (!permisoId) {
              console.warn(`ID no encontrado para permiso '${nombre}'. Se omite asignación.`);
              return Promise.resolve();
            }
            return PermisosService.asignarPermisoARol(rolId, permisoId);
          }),
          ...porRemover.map(nombre => {
            const permisoId = permisoNameToId[nombre];
            if (!permisoId) {
              console.warn(`ID no encontrado para permiso '${nombre}'. Se omite remoción.`);
              return Promise.resolve();
            }
            return PermisosService.removerPermisoDeRol(rolId, permisoId);
          })
        ]);
        console.log('Rol y permisos actualizados exitosamente');
        await cargarRoles();
        cerrarModales();
        await Swal.fire({
          icon: "success",
          title: "Rol actualizado",
          text: "Los cambios se han guardado correctamente.",
          confirmButtonColor: "#ffc600",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        const creado = await rolesService.crearRol({
          nombreRol: nuevo.nombre,
          descripcion: nuevo.descripcion,
          activo: true
        });
        const rolId = (creado && (creado.id || creado.Id)) || null;
        if (!rolId) {
          console.warn('No se pudo determinar el ID del rol recién creado. Intentando cargar roles...');
        } else {
          // Asignar todos los permisos seleccionados
          const seleccionados = mapPermisosNombres(nuevo.permisos);
          await Promise.all(seleccionados.map(nombre => {
            const permisoId = permisoNameToId[nombre];
            if (!permisoId) {
              console.warn(`ID no encontrado para permiso '${nombre}'. Se omite asignación.`);
              return Promise.resolve();
            }
            return PermisosService.asignarPermisoARol(rolId, permisoId);
          }));
        }
        console.log('Rol creado y permisos asignados exitosamente');
        await cargarRoles();
        cerrarModales();
        await Swal.fire({
          icon: "success",
          title: "Rol creado",
          text: "El rol ha sido agregado correctamente.",
          confirmButtonColor: "#ffc600",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error('Error:', error);
      const mensaje = error?.message || (editando ? 'No se pudo actualizar el rol' : 'No se pudo crear el rol');
      mostrarErrorHttp(error, mensaje);
    } finally {
      setLoading(false);
    }
  };

  const editarRol = (rol) => {
    abrirModalEditar(rol);
  };

  const eliminarRol = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
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
        await rolesService.eliminarRol(id);
        await cargarRoles();
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'El rol ha sido eliminado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error al eliminar rol:', error);
        mostrarErrorHttp(error, 'No se pudo eliminar el rol');
      } finally {
        setLoading(false);
      }
    }
  };

  const mostrarDetalles = (rol) => setModalDetalles(rol);
  const cerrarDetalles = () => {
    setModalDetalles(null);
    resetearFormulario();
  };



  const permisosFiltrados = permisosDisponibles.filter((p) =>
    p && p.toLowerCase().includes(permisoBusqueda.toLowerCase())
  );
  const totalPaginas = Math.ceil(permisosFiltrados.length / 4);
  const permisosPaginados = permisosFiltrados.slice(
    (paginaPermisos - 1) * 4,
    paginaPermisos * 4
  );

  const rolesFiltrados = roles.filter((r) => {
    const nombre = r.nombre || r.nombreRol || '';
    return nombre.toLowerCase().includes(busqueda.toLowerCase());
  });

  // Lógica de paginación para roles
  const indicePrimerRol = (paginaActual - 1) * rolesPorPagina;
  const indiceUltimoRol = indicePrimerRol + rolesPorPagina;
  const rolesActuales = rolesFiltrados.slice(indicePrimerRol, indiceUltimoRol);
  const totalPaginasRoles = Math.ceil(rolesFiltrados.length / rolesPorPagina);

  const cambiarPaginaRoles = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  return (
    <div className="roles-container">
      <div className="roles-header">
        <div className="header-left">
          <h2>ROLES <span className="contador-roles">({rolesFiltrados.length})</span></h2>
        </div>
        <div className="header-right">
          <div className="acciones-globales">
            <input
              type="text"
              className="input-busqueda"
              placeholder="Buscar Rol..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <button 
              onClick={() => setModalAgregar(true)} 
              className="btn-agregar"
              disabled={loading}
            >
              Agregar Rol
            </button>
          </div>
        </div>
      </div>

      <Dialog.Root open={modalAgregar || modalEditar} onOpenChange={cerrarModales}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content
            className="dialog-content dialog-content-roles"
            ref={dialogContentRef}
            onEscapeKeyDown={cerrarModales}
            onInteractOutside={cerrarModales}
          >
            <Dialog.Close asChild>
              <button className="dialog-close-unified">
                &times;
              </button>
            </Dialog.Close>
            
            <Dialog.Title className="dialog-title">
              {editando ? "Editar Rol" : "Formulario de agregar rol"}
            </Dialog.Title>
            <div className="tabs-nav">
              <button className={`tab-btn ${activeTab === 'basica' ? 'activa' : ''}`} onClick={() => setActiveTab('basica')}>Básica</button>
              <button className={`tab-btn ${activeTab === 'permisos' ? 'activa' : ''}`} onClick={() => setActiveTab('permisos')}>Permisos</button>
            </div>
            
            <div className="formulario-unico">
              {activeTab === 'basica' && (
              <div className="seccion-formulario">
                <h3 className="titulo-seccion">
                  Información Básica
                  <div className="linea-titulo"></div>
                </h3>
                <div className="grid-basica">
                  <div className="col">
                    <div className="campo-moderno">
                      <label>Nombre del Rol <span className="requerido">*</span></label>
                      <input
                        type="text"
                        value={nuevo.nombre}
                        onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                        placeholder="Ingrese el nombre del rol"
                        className="input-moderno"
                      />
                    </div>
                  </div>
                  <div className="col">
                    <div className="campo-moderno">
                      <label>Descripción</label>
                      <input
                        type="text"
                        value={nuevo.descripcion}
                        onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })}
                        placeholder="Descripción del rol (opcional)"
                        className="input-moderno"
                      />
                    </div>
                    {/* Campo Estado removido en edición; el estado se controla con el botón externo en la tabla */}
                  </div>
                </div>
                <div className="acciones-seccion">
                  <button className="btn-volver-arriba" onClick={backToTop}>Volver arriba</button>
                </div>
              </div>
              )}

              {activeTab === 'permisos' && (
              <div className="seccion-formulario">
                <h3 className="titulo-seccion">
                  Asignación de Permisos
                  <div className="linea-titulo"></div>
                </h3>
                <div className="campo-moderno">
                  <label>Buscar Permisos</label>
                  <input
                    type="text"
                    placeholder="Escriba para buscar permisos..."
                    value={permisoBusqueda}
                    onChange={(e) => {
                      setPermisoBusqueda(e.target.value);
                      setPaginaPermisos(1);
                    }}
                    className="input-moderno input-busqueda"
                  />
                </div>
                
                {(() => {
                  const todos = permisosDisponibles.filter(p => p && p.toLowerCase().includes(permisoBusqueda.toLowerCase()));
                  const cats = categorizePermisos(todos);
                  const entries = Object.entries(cats);
                  const [loadCountByCat, setLoadCountByCat] = [categoriaLoadCountRef.current, setCategoriaLoadCount];
                  return (
                    <div className="permisos-categorias">
                      <div className="permisos-chips">
                        {entries.map(([cat, lista]) => (
                          lista.length > 0 && (
                            <button key={`chip-${cat}`} type="button" className={`chip ${categoriasAbiertas[cat] ? 'activa' : ''}`} onClick={() => setOnlyCategoriaOpen(cat)}>
                              {cat}
                              <span className="chip-count">{lista.filter(p => nuevo.permisos.includes(p)).length}/{lista.length}</span>
                            </button>
                          )
                        ))}
                      </div>
                      {entries.map(([cat, lista]) => (
                        lista.length > 0 && (
                          <div key={cat} className="categoria-card">
                            <div className="categoria-header" onClick={() => toggleCategoriaOpen(cat)} role="button" aria-expanded={categoriasAbiertas[cat]}>
                              <div className="categoria-titulo">
                                <span className="cat-nombre">{cat}</span>
                                <span className="cat-count">{lista.filter(p => nuevo.permisos.includes(p)).length}/{lista.length}</span>
                              </div>
                              <div className="categoria-controles">
                                <button type="button" className="toggle-todos" onClick={(e) => { e.stopPropagation(); toggleCategoriaAll(cat, lista); }}>
                                  {lista.every(p => nuevo.permisos.includes(p)) ? 'Quitar todos' : 'Seleccionar todos'}
                                </button>
                                <svg className={`chevron ${categoriasAbiertas[cat] ? 'abierto' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none"/>
                                </svg>
                              </div>
                            </div>
                            {categoriasAbiertas[cat] && (
                              <div className="categoria-body">
                                {lista.slice(0, (loadCountByCat[cat] ?? 10)).map((permiso) => (
                                  <label key={`${cat}-${permiso}`} className={`permiso-item-modern ${nuevo.permisos.includes(permiso) ? 'seleccionado' : 'no-seleccionado'}`}>
                                    <input
                                      type="checkbox"
                                      checked={nuevo.permisos.includes(permiso)}
                                      onChange={() => togglePermiso(permiso)}
                                    />
                                    <span className="permiso-nombre">{permiso}</span>
                                    <span className={`estado-dot ${nuevo.permisos.includes(permiso) ? 'on' : 'off'}`}></span>
                                  </label>
                                ))}
                                {lista.length > (loadCountByCat[cat] ?? 10) && (
                                  <div className="categoria-loadmore">
                                    <button type="button" onClick={() => setCategoriaLoadCount(prev => ({ ...prev, [cat]: (prev[cat] ?? 10) + 10 }))}>Mostrar más</button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      ))}
                    </div>
                  );
                })()}
                <div className="acciones-seccion">
                  <button className="btn-volver-arriba" onClick={backToTop}>Volver arriba</button>
                </div>
              </div>
              )}
            </div>
            
            <div className="dialog-actions-centrado">
              <button 
                onClick={handleAgregar} 
                className="btn btn-confirmar"
                disabled={loading}
              >
                {loading ? 'Procesando...' : (editando ? "Editar Rol" : "Agregar Rol")}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal Detalles */}
      <Dialog.Root open={!!modalDetalles} onOpenChange={cerrarDetalles}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content
            className="dialog-content dialog-detalles"
            onEscapeKeyDown={cerrarDetalles}
            onInteractOutside={cerrarDetalles}
          >
            <Dialog.Close asChild>
              <button className="dialog-close-unified" aria-label="Cerrar">&times;</button>
            </Dialog.Close>
            
            <Dialog.Title className="modal-titulo-base">
              Detalles del Rol
            </Dialog.Title>
            
            {modalDetalles && (
              <>
                <div className="seccion-detalles-base">
                  <h3 className="titulo-seccion-base">Información del Rol</h3>
                  <div className="formulario-dos-columnas-base">
                    <div className="detalle-grupo-base">
                      <label>Nombre:</label>
                      <span>{modalDetalles.nombre || modalDetalles.nombreRol}</span>
                    </div>
                    <div className="detalle-grupo-base">
                      <label>Descripción:</label>
                      <span>{modalDetalles.descripcion}</span>
                    </div>
                    <div className="detalle-grupo-base">
                      <label>Permisos:</label>
                      <span>
                        {mapPermisosNombres(modalDetalles.permisos).length > 0 ? (
                          mapPermisosNombres(modalDetalles.permisos).join(", ")
                        ) : (
                          "No tiene permisos asignados"
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

      {/* Tabla de Roles */}
      <div className="tabla-wrapper">
        <table className="tabla-roles">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Permisos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="sin-resultados">Cargando roles...</td>
              </tr>
            ) : rolesActuales.map((r) => (
              <tr key={r.id} className={!r.activo ? "fila-anulada" : ""}>
                <td>{r.nombre || r.nombreRol}</td>
                <td>{r.descripcion}</td>
                <td>
                  {mapPermisosNombres(r.permisos).slice(0, 2).join(", ")}
                  {mapPermisosNombres(r.permisos).length > 2 && "…"}
                </td>
                <td>
                  <button
                    className={`estado ${r.activo ? "activa" : "anulada"}`}
                    onClick={() => toggleEstadoRol(r.id)}
                    title={r.activo ? 'Clic para desactivar' : 'Clic para activar'}
                    disabled={loading}
                  >
                    {r.activo ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="acciones">
                  <button 
                    onClick={() => mostrarDetalles(r)} 
                    className="btn-icono btn-detalles" 
                    title="Ver Detalles"
                    disabled={loading}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#6b7280"/>
                    </svg>
                  </button>

                  <button 
                    onClick={() => editarRol(r)} 
                    className="btn-icono btn-editar" 
                    title="Editar"
                    disabled={loading}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="#6b7280"/>
                      <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="#6b7280"/>
                    </svg>
                  </button>

                  <button 
                    onClick={() => eliminarRol(r.id)} 
                    className="btn-icono btn-eliminar" 
                    title="Eliminar"
                    disabled={loading}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#dc2626"/>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {rolesFiltrados.length === 0 && (
              <tr>
                <td colSpan="5" className="sin-resultados">No se encontraron roles.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Componente de paginación */}
      <Pagination
        currentPage={paginaActual}
        totalPages={totalPaginasRoles}
        onPageChange={cambiarPaginaRoles}
        itemsPerPage={rolesPorPagina}
        totalItems={rolesFiltrados.length}
      />
    </div>
  );
};

export default RolesTable;

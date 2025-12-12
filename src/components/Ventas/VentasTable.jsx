import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import './VentasTable.scss';
import { MdRemoveRedEye, MdPictureAsPdf, MdAdd, MdCheck, MdRemove, MdDelete, MdClose } from "react-icons/md";
import { crearEncabezado, crearPiePagina, configuracionTabla, formatearMoneda, formatearFecha, COLORES, crearSeccionInformacion, crearSeccionTotales, EMPRESA_CONFIG } from '../../Utils/pdfUtils';
import { API_BASE_URL, API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '../../constants/apiConstants';
import { getToken as getStoreToken } from '../../features/auth/tokenStore';
import productoVariantesService from '../../services/productoVariantesService';
import Pagination from '../shared/Pagination';
import ventasService from '../../services/ventasService';
import pedidosService from '../../services/pedidosService';
import usuariosService from '../../services/usuariosService';
import clientesService from '../../services/clientesService';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { formatPriceCL } from '../../Utils/priceUtils';
import { useNavigate, useLocation } from 'react-router-dom';
const showSwalSafe = (closeDialogFn, config) => {
  if (closeDialogFn) closeDialogFn(false);
  setTimeout(() => {
    Swal.fire(config);
  }, 50);
};
const getGainPctForProduct = (id, productos = []) => {
  try {
    const p = (productos || []).find(x => (x?.id || x?.idProducto) === id);
    const apiPct = parseFloat(String(p?.porcentajeGanancia ?? p?.gananciaPct ?? '').trim());
    if (Number.isFinite(apiPct) && apiPct >= 0) return Math.min(100, apiPct);
    const raw = localStorage.getItem(`product-gain-pct:${id}`);
    const n = parseFloat(String(raw ?? '').trim());
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  } catch {
    return 0;
  }
};
const loadSizeIncrements = () => {
  try {
    const raw = localStorage.getItem('size-price-increments');
    const parsed = JSON.parse(raw || '{}');
    const defaults = { S: 0, M: 10, L: 20, XL: 30 };
    return { ...defaults, ...parsed };
  } catch {
    return { S: 0, M: 10, L: 20, XL: 30 };
  }
};
const computePriceWithTalla = (producto, talla) => {
  const base = Number(producto?.precio || 0);
  const incs = loadSizeIncrements();
  const pct = Number(incs?.[String(talla || '').toUpperCase()] ?? 0);
  const price = Number(producto?.precioTalla ?? (base * (1 + (pct / 100))));
  return { price, pct, base };
};
const VentasTable = ({ filterByEstado = null, title = null }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [ventas, setVentas] = useState([]);
  const [stock, setStock] = useState({});
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState([]);
  const [nueva, setNueva] = useState({ 
    fecha: new Date().toISOString().split('T')[0],
    usuarioId: '',
    usuario: '',
    total: 0,
    documento: '',
    telefono: '',
    ciudad: ''
  });
  const [productosVenta, setProductosVenta] = useState([]);
  const [tempProducto, setTempProducto] = useState({ 
    id: '', 
    nombre: '', 
    precio: 0, 
    stock: 0, 
    cantidad: '',
    color: '',
    talla: '',
    precioTalla: '',
    gramos: '',
    esConcentrado: false,
    factorGramo: 1,
    habilitaColor: false,
    habilitaTalla: false
  });
  const [coloresDisponibles, setColoresDisponibles] = useState([]);
  const [tallasDisponibles, setTallasDisponibles] = useState([]);

  const cargarPrecioTallaGuardado = async (productoId, talla) => {
    const val = await productoVariantesService.obtenerPrecioTalla(productoId, talla);
    if (val) setTempProducto(prev => ({ ...prev, precioTalla: val }));
  };

  const [detalleVenta, setDetalleVenta] = useState(null);
  const [verDetalleOpen, setVerDetalleOpen] = useState(false);
  const [agregarOpen, setAgregarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [ventasPorPagina] = useState(5);
  const roleNameLc = String(user?.role || user?.Rol || user?.nombreRol || '').toLowerCase();
  const esAdmin = ['administrador','asistente'].includes(roleNameLc);
  const displayTitle = String(
    title || (String(filterByEstado || '').toLowerCase() === 'pendiente' ? 'PEDIDOS' : (esAdmin ? 'VENTAS' : 'MIS COMPRAS'))
  ).toUpperCase();

  // Función para cargar usuarios desde la API
  const cargarUsuarios = async () => {
    try {
      const usuarios = await usuariosService.obtenerTodos();
      const usuariosActivos = (usuarios || []).filter(u => u.activo === true || u.activo === 'true' || u.activo === 1);
      setUsuariosDisponibles(usuariosActivos);
      
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setUsuariosDisponibles([]);
      
      Swal.fire({
        icon: 'error',
        title: 'Error al cargar usuarios',
        text: 'No se pudieron cargar los usuarios. Verifique la conexión con la API.'
      });
    }
  };
  // Función para cargar clientes desde la API
  const cargarClientes = async () => {
    try {
      const lista = await clientesService.obtenerClientes();
      const activos = (lista || []).filter(c => c.activo !== false);
      setClientes(activos);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      setClientes([]);
      Swal.fire({
        icon: 'error',
        title: 'Error al cargar clientes',
        text: 'No se pudieron cargar los clientes. Verifique la conexión con la API.'
      });
    }
  };

  // Función para cargar productos desde la API
  const cargarProductos = async () => {
    try {
      const url = buildApiUrl(API_ENDPOINTS.PRODUCTOS.GET_ALL);
      console.log('Cargando productos desde:', url);
      const bearer = getStoreToken();
      const headers = bearer ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${bearer}` } : { ...DEFAULT_HEADERS };
      console.log('Headers utilizados:', headers);
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      
      console.log('Respuesta recibida:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const productos = await response.json();
      console.log('Productos cargados desde API:', productos);
      console.log('Total de productos recibidos:', productos.length);
      
      // Filtrar solo productos activos (temporalmente mostrando todos para debug)
      console.log('Estructura de productos:', productos.map(p => ({ id: p.id, idProducto: p.idProducto, activo: p.activo, nombre: p.nombre || p.nombreProducto })));
      
      const productosActivos = productos.filter(p => p.activo === true || p.activo === 'true' || p.activo === 1);
      console.log('Productos activos encontrados:', productosActivos.length);
      console.log('Productos activos:', productosActivos);
      
      // Si no hay productos activos, mostrar todos temporalmente
      const productosParaMostrar = productosActivos.length > 0 ? productosActivos : productos;
      console.log('Productos que se mostrarán:', productosParaMostrar);
      setProductosDisponibles(productosParaMostrar);
      
      // Crear objeto de stock para compatibilidad
      const stockInicial = {};
      productos.forEach(p => {
        stockInicial[p.id || p.idProducto] = {
          nombre: p.nombreProducto || p.nombre,
          stock: parseInt(p.stock || 0),
          activo: p.activo,
          precio: parseInt(p.precio || 0)
        };
      });
      setStock(stockInicial);
      
    } catch (error) {
      console.error('Error al cargar productos:', error);
      
      // No hay productos disponibles
      setProductosDisponibles([]);
      setStock({});
      
      Swal.fire({
        icon: 'error',
        title: 'Error al cargar productos',
        text: 'No se pudieron cargar los productos. Verifique la conexión con la API.'
      });
    }
  };

  const cargarColores = async () => {
    try {
      const url = buildApiUrl(API_ENDPOINTS.COLORES.GET_ALL + '?includeInactive=true');
      const bearer = getStoreToken();
      const headers = bearer ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${bearer}` } : { ...DEFAULT_HEADERS };
      const response = await fetch(url, { method: 'GET', headers, credentials: 'include' });
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
      const data = await response.json();
      const activos = (data || []).filter(c => c.activo === true || c.activo === 'true' || c.activo === 1);
      setColoresDisponibles(activos.length > 0 ? activos : (data || []));
    } catch (error) {
      console.error('Error al cargar colores:', error);
      setColoresDisponibles([]);
    }
  };

  const cargarTallas = async () => {
    try {
      const url = buildApiUrl('/api/tallas?includeInactive=true');
      const bearer = getStoreToken();
      const headers = bearer ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${bearer}` } : { ...DEFAULT_HEADERS };
      const response = await fetch(url, { method: 'GET', headers, credentials: 'include' });
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
      const data = await response.json();
      const activos = (data || []).filter(t => t.activo === true || t.activo === 'true' || t.activo === 1);
      setTallasDisponibles(activos.length > 0 ? activos : (data || []));
    } catch (error) {
      console.error('Error al cargar tallas:', error);
      setTallasDisponibles([]);
    }
  };

  // Función para cargar ventas desde la API
  const cargarVentas = async () => {
    try {
      if (filterByEstado && filterByEstado.toLowerCase() === 'pendiente') {
        let pedidos = [];
        if (esAdmin) {
          pedidos = await pedidosService.obtenerPedidos();
        } else {
          try {
            pedidos = await clientesService.obtenerMisPedidos();
          } catch {
            try {
              const todos = await pedidosService.obtenerPedidos();
              const me = await clientesService.obtenerMiCliente();
              const miId = Number(me?.id || me?.Id || 0);
              pedidos = (Array.isArray(todos) ? todos : []).filter(x => {
                const cid = Number(x?.cliente?.id || x?.clienteId || x?.ClienteId || 0);
                return miId && cid === miId;
              });
            } catch {
              pedidos = [];
            }
          }
        }
        const pedidosFormateados = (Array.isArray(pedidos) ? pedidos : []).map(p => ({
          id: p.id || p.Id,
          fecha: p.fechaPedido ? new Date(p.fechaPedido).toISOString().split('T')[0] : (p.fechaCreacion ? new Date(p.fechaCreacion).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          usuario: p.cliente?.nombres || p.cliente?.nombre || p.cliente?.Nombre || 'Cliente',
          total: p.total ?? p.Total ?? ((p.Subtotal || 0) + (p.Impuestos || 0) + (p.CostoEnvio || 0)),
          estado: p.estado || p.Estado || p.estadoPedido || p.EstadoPedido || 'Pendiente',
          productos: (p.detallesPedido || p.DetallesPedido || []).map(dp => ({
            id: dp.productoId || dp.ProductoId,
            nombre: dp.producto?.nombre || dp.Producto?.Nombre || 'Producto',
            cantidad: dp.cantidad || dp.Cantidad,
            precio: dp.precioUnitario || dp.PrecioUnitario
          }))
        }));
        setVentas(pedidosFormateados);
      } else {
        let url = buildApiUrl(API_ENDPOINTS.VENTAS.GET_ALL);
        let soloMisVentas = false;
        const role = (user?.role || '').toLowerCase();
        if (isAuthenticated && role && !['administrador', 'asistente'].includes(role)) {
          try {
            const me = await clientesService.obtenerMiCliente();
            const clienteId = me?.id;
            if (clienteId) {
              url = buildApiUrl(`/api/ventas/cliente/${clienteId}`);
              soloMisVentas = true;
            }
          } catch (e) {
            console.warn('No se pudo obtener cliente actual, cargando todas las ventas:', e?.message || e);
          }
        }
        const bearer = getStoreToken();
        const headers = bearer ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${bearer}` } : { ...DEFAULT_HEADERS };
        const response = await fetch(url, {
          method: 'GET',
          headers,
          credentials: 'include'
        });
        if (!response.ok) {
          const txt = await response.text().catch(() => '');
          throw new Error(`Error ${response.status}: ${txt || response.statusText}`);
        }
        const ventasData = await response.json();
        const ventasFormateadas = (Array.isArray(ventasData) ? ventasData : []).map(venta => ({
          id: venta.id,
          fecha: venta.fechaVenta ? new Date(venta.fechaVenta).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          usuario: venta.cliente?.nombres || venta.cliente?.nombre || 'Usuario',
          total: venta.total || 0,
          estado: venta.estado || 'activa',
          productos: (venta.detallesVenta || []).map(detalle => ({
            id: detalle.productoId,
            nombre: detalle.producto?.nombre || 'Producto',
            cantidad: detalle.cantidad,
            precio: detalle.precioUnitario,
            color: detalle.producto?.color || null,
            talla: detalle.producto?.talla || null,
            medida: detalle.producto?.medida || null
          }))
        }));
        setVentas(ventasFormateadas);
      }
      
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      setVentas([]);
      const mensaje = (error && error.message) ? String(error.message) : 'No se pudieron cargar las ventas. Verifique la conexión con la API.';
      Swal.fire({
        icon: 'error',
        title: 'Error al cargar ventas',
        text: mensaje
      });
    }
  };

  useEffect(() => {
    // Cargar datos desde la API
    cargarProductos();
    cargarClientes();
    cargarColores();
    cargarTallas();
  }, []);
  useEffect(() => {
    cargarVentas();
  }, [isAuthenticated, user, filterByEstado, location.key]);
  useEffect(() => {
    // Los usuarios se cargarán desde la API cuando sea necesario
  }, []);
  const guardarVentas = (lista) => {
    setVentas(lista);
  };
  const agregarProductoTemporal = () => {
    const { id, cantidad } = tempProducto;
    
    console.log('=== AGREGAR PRODUCTO ===');
    console.log('TempProducto:', tempProducto);
    console.log('ID:', id, 'Cantidad:', cantidad);

    if (!id || !cantidad) {
      console.log('Faltan datos del producto temporal');
      Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        text: 'Selecciona un producto e ingresa la cantidad.',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
      return;
    }

    const cantidadNum = parseInt(cantidad);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidad inválida',
        text: 'La cantidad debe ser un número mayor a 0.',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
      return;
    }

    const producto = productosDisponibles.find(p => p.id === parseInt(id));
    if (!producto) {
      Swal.fire({
        icon: 'warning',
        title: 'Producto no encontrado',
        text: 'El producto seleccionado no está disponible.',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
      return;
    }

    const stockDisponible = parseInt(producto.stock);
    if (cantidadNum > stockDisponible) {
      Swal.fire({
        icon: 'warning',
        title: 'Stock insuficiente',
        text: `Solo hay ${stockDisponible} unidades disponibles.`,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
      return;
    }

    const productoExistente = productosVenta.find(p => p.id === producto.id);
    if (productoExistente) {
      Swal.fire({
        icon: 'warning',
        title: 'Producto duplicado',
        text: 'Este producto ya está en la lista.',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
      return;
    }

    const nuevoProductoVenta = {
      id: producto.id,
      nombre: producto.nombre,
      cantidad: cantidadNum,
      precioUnitario: parseFloat(producto.precio),
      // Mantener precio para compatibilidad con UI actual
      precio: parseFloat(producto.precio),
      precioTalla: tempProducto.precioTalla ? parseFloat(tempProducto.precioTalla) : null,
      color: tempProducto.color || null,
      talla: tempProducto.talla || null,
      medida: producto.medida || null,
      gramos: tempProducto.gramos || null,
      esConcentrado: tempProducto.esConcentrado || false,
      factorGramo: tempProducto.factorGramo || 1
    };

    console.log('Producto agregado exitosamente:', nuevoProductoVenta);
    console.log('Lista actual de productos antes de agregar:', productosVenta);
    
    setProductosVenta([...productosVenta, nuevoProductoVenta]);
    setTempProducto({ ...tempProducto, cantidad: '', color: '', talla: '', gramos: '' });
    
    console.log('========================');
  };
  const manejarSeleccionUsuario = (usuarioId) => {
    console.log('=== SELECCIÓN USUARIO ===');
    console.log('UsuarioId recibido:', usuarioId, 'Tipo:', typeof usuarioId);
    
    if (!usuarioId) {
      console.log('UsuarioId vacío, limpiando estado');
      setNueva({ ...nueva, usuarioId: '', usuario: '' });
      return;
    }
    
    const cliente = clientes.find(c => c.id === parseInt(usuarioId));
    console.log('Cliente encontrado:', cliente);
    
    if (cliente) {
      const nuevoEstado = {
        ...nueva,
        usuarioId: usuarioId,
        usuario: `${cliente.nombres || cliente.nombre || ''} ${cliente.apellidos || ''}`.trim()
      };
      console.log('Actualizando estado nueva a:', nuevoEstado);
      setNueva(nuevoEstado);
    }
    console.log('========================');
  };

  const manejarSeleccionProducto = (productoId) => {
    if (!productoId) {
      setTempProducto({ id: '', nombre: '', precio: 0, stock: 0, cantidad: '', color: '', talla: '', gramos: '', esConcentrado: false, factorGramo: 1, habilitaColor: false, habilitaTalla: false });
      return;
    }

    const producto = productosDisponibles.find(p => (p.id || p.idProducto) === parseInt(productoId));
    if (producto) {
      const categoriaNombre = (producto.categoria?.nombre || '').toLowerCase();
      const abrev = (producto.medida?.abreviatura || '').toLowerCase();
      const esConcentrado = categoriaNombre.includes('concentrado') || abrev === 'kg' || abrev === 'g' || abrev === 'ml';
      const esAlimento = /alimento|comida|concentrado|cuido/.test(categoriaNombre) || ['kg','g','ml'].includes(abrev);
      const habilitaColor = !esAlimento;
      const habilitaTalla = !esAlimento;
      const factorGramo = abrev === 'kg' ? 1000 : 1;
      setTempProducto({
        id: producto.id || producto.idProducto,
        nombre: producto.nombreProducto || producto.nombre,
        precio: parseFloat(producto.precio || 0),
        stock: parseInt(producto.stock || 0),
        cantidad: '',
        color: habilitaColor ? '' : '',
        talla: habilitaTalla ? '' : '',
        gramos: '',
        esConcentrado,
        factorGramo,
        habilitaColor,
        habilitaTalla
      });
    }
  };

  const incrementarCantidad = (idProducto) => {
    const producto = productosVenta.find(p => p.id === idProducto);
    const productoOriginal = productosDisponibles.find(p => p.id === idProducto);
    
    if (producto && productoOriginal) {
      const nuevaCantidad = producto.cantidad + 1;
      
      if (nuevaCantidad > productoOriginal.stock) {
        Swal.fire({
          icon: 'warning',
          title: 'Stock insuficiente',
          text: `Solo hay ${productoOriginal.stock} unidades disponibles.`,
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
        return;
      }
      
      const productosActualizados = productosVenta.map(p => 
        p.id === idProducto ? { ...p, cantidad: nuevaCantidad } : p
      );
      setProductosVenta(productosActualizados);
    }
  };

  const decrementarCantidad = (idProducto) => {
    const producto = productosVenta.find(p => p.id === idProducto);
    
    if (producto) {
      if (producto.cantidad === 1) {
        Swal.fire({
          title: '¿Eliminar producto?',
          text: 'La cantidad llegará a 0. ¿Deseas eliminar este producto de la venta?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#d33'
        }).then((result) => {
          if (result.isConfirmed) {
            quitarProductoTemporal(idProducto);
          }
        });
      } else {
        const productosActualizados = productosVenta.map(p => 
          p.id === idProducto ? { ...p, cantidad: p.cantidad - 1 } : p
        );
        setProductosVenta(productosActualizados);
      }
    }
  };

  const quitarProductoTemporal = (idProducto) => {
    const actualizados = productosVenta.filter(p => p.id !== idProducto);
    setProductosVenta(actualizados);
  };
  const handleAgregar = async () => {
    const { fecha, usuarioId, documento, telefono, ciudad } = nueva;
    
    // Logs de depuración para identificar el problema
    console.log('=== DEPURACIÓN HANDLEAGREGAR ===');
    console.log('Estado nueva:', nueva);
    console.log('Fecha:', fecha, 'Tipo:', typeof fecha, 'Vacío?:', !fecha);
    console.log('UsuarioId:', usuarioId, 'Tipo:', typeof usuarioId, 'Vacío?:', !usuarioId);
    console.log('ProductosVenta:', productosVenta);
    console.log('ProductosVenta.length:', productosVenta.length);
    console.log('Validación fecha:', !fecha);
    console.log('Validación usuarioId:', !usuarioId);
    console.log('Validación productos:', productosVenta.length === 0);
    console.log('================================');
    
    if (!fecha || !usuarioId || productosVenta.length === 0) {
      console.log('VALIDACIÓN FALLÓ - Mostrando mensaje de error');
      Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Completa todos los campos y agrega al menos un producto.',
        showConfirmButton: false,
        timer: 1000,
        timerProgressBar: true
      });
      return;
    }
    
    const total = productosVenta.reduce((acc, p) => acc + (p.cantidad * p.precio), 0);
    
    // Preparar datos para la API (conforme al DTO del backend)
    const ventaData = {
      clienteId: parseInt(usuarioId),
      fechaVenta: fecha,
      metodoPago: 'Efectivo',
      estado: 'Completada',
      observaciones: undefined,
      detallesVenta: productosVenta.map(producto => ({
        productoId: producto.id,
        cantidad: producto.cantidad,
        precioUnitario: Number(producto.precio)
      }))
    };
    
    try {
      const url = buildApiUrl(API_ENDPOINTS.VENTAS.CREATE);
      console.log('Creando venta en:', url);
      console.log('Datos de venta:', ventaData);
      
      const bearer = getStoreToken();
      const headers = bearer ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${bearer}` } : { ...DEFAULT_HEADERS };
      const response = await fetch(url, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(ventaData)
      });
      
      console.log('Respuesta de creación de venta:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const ventaCreada = await response.json();
      console.log('Venta creada:', ventaCreada);
      try {
        const clienteId = ventaCreada?.cliente?.id || ventaCreada?.clienteId;
        const payload = {
          documento: String(nueva.documento || '').trim() || undefined,
          telefono: String(nueva.telefono || '').trim() || undefined,
          ciudad: String(nueva.ciudad || '').trim() || undefined
        };
        const hasData = Object.values(payload).some(v => !!v);
        if (clienteId && hasData) {
          try {
            await clientesService.actualizarContacto(clienteId, payload);
            console.log('Contacto del cliente actualizado desde la venta');
          } catch (err1) {
            console.warn('Fallo actualizar contacto, intentando actualizar cliente:', err1?.message || err1);
            try {
              await clientesService.actualizarCliente(clienteId, payload);
              console.log('Cliente actualizado vía endpoint general');
            } catch (err2) {
              console.error('No se pudo actualizar datos de contacto del cliente:', err2?.message || err2);
              Swal.fire({ icon: 'warning', title: 'No se pudo guardar contacto', text: 'Inténtalo de nuevo o edita el cliente.' });
            }
          }
        }
      } catch (e) {
        console.warn('No se pudo actualizar datos del cliente tras la venta:', e?.message || e);
      }
      
      // Recargar las ventas para mostrar la nueva
      await cargarVentas();
      
      // Recargar los productos para mostrar el stock actualizado
      await cargarProductos();
      
      // Limpiar formulario completamente
      setNueva({ 
        fecha: new Date().toISOString().split('T')[0], 
        usuarioId: '',
        usuario: '', 
        total: 0,
        documento: '',
        telefono: '',
        ciudad: ''
      });
      setProductosVenta([]);
      
      // Resetear el producto temporal para limpiar los selects
      setTempProducto({ 
        id: '', 
        nombre: '', 
        precio: 0, 
        stock: 0, 
        cantidad: '',
        color: '',
        talla: '',
        precioTalla: '',
        gramos: '',
        esConcentrado: false,
        factorGramo: 1,
        habilitaColor: false,
        habilitaTalla: false
      });
      
      showSwalSafe(null, {
        icon: 'success',
        title: 'Venta registrada',
        text: `Venta registrada exitosamente en la base de datos.`,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
      setAgregarOpen(false);
      
    } catch (error) {
      console.error('Error al crear venta:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Error al registrar venta',
        text: 'No se pudo registrar la venta. Verifique la conexión con la API.'
      });
    }
  };
  const normalizarEstado = (s) => {
    const t = (s || '').toLowerCase();
    if (t === 'activa' || t === 'completada') return 'Pagado';
    if (t === 'pendiente') return 'Pendiente';
    if (t === 'en proceso') return 'Pendiente';
    if (t === 'anulada') return 'INHABILITADA';
    return t || 'Pagado';
  };
  const ventasFiltradas = ventas
    .filter(v =>
      (v.usuario + ' ' + v.fecha + ' ' + (v.productos || []).map(p => p.nombre).join(' '))
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    )
    .filter(v => !filterByEstado || normalizarEstado(v.estado) === filterByEstado);

  // Lógica de paginación
  const indiceUltimaVenta = paginaActual * ventasPorPagina;
  const indicePrimeraVenta = indiceUltimaVenta - ventasPorPagina;
  const ventasActuales = ventasFiltradas.slice(indicePrimeraVenta, indiceUltimaVenta);
  const totalPaginas = Math.ceil(ventasFiltradas.length / ventasPorPagina);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const generarPDF = (venta) => {
    console.log('Generando PDF para venta:', venta);
    try {
      const doc = new jsPDF();
    
    // Crear encabezado profesional con tipo de documento
    const inicioContenido = crearEncabezado(doc, 'FACTURA DE VENTA', `Factura No. ${String(venta.id).padStart(6, '0')}`, 'FACTURA');
    
    // Información de la venta con diseño mejorado
    const datosVenta = {
      'Fecha de Venta': formatearFecha(venta.fecha),
      'Número de Factura': String(venta.id).padStart(6, '0'),
      'Estado': venta.estado.toUpperCase(),
      'Sucursal': EMPRESA_CONFIG.ciudad,
      'Vendedor': 'Sistema PetLove',
      'Forma de Pago': 'Efectivo'
    };
    
    let yPos = crearSeccionInformacion(doc, 'INFORMACIÓN DE LA VENTA', datosVenta, inicioContenido + 5, { columnas: 2, espaciado: 6, offsetValor: 28 });
    
    // Información del cliente con diseño mejorado
    const usuarioNombre = (venta?.cliente?.nombres || venta?.cliente?.nombre || venta?.cliente || 'Usuario General');
    const datosCliente = {
      'Usuario': usuarioNombre,
      'Documento': venta?.cliente?.documento || 'N/A',
      'Teléfono': venta?.cliente?.celular || 'N/A',
      'Email': venta?.cliente?.email || 'N/A',
      'Dirección': venta?.cliente?.direccion || 'N/A',
      'Ciudad': venta?.cliente?.ciudad || EMPRESA_CONFIG.ciudad
    };
    
    yPos = crearSeccionInformacion(doc, 'INFORMACIÓN DEL USUARIO', datosCliente, yPos + 5, { columnas: 2, espaciado: 6, offsetValor: 28 });
    
    // Detalle de productos con tabla mejorada
    const encabezados = ['#', 'Producto', 'Color', 'Talla', 'Medida', 'Gramos', 'Cantidad', 'Precio Unit.', 'Ganancia (%)', 'Descuento', 'Subtotal'];
    const datosTabla = venta.productos?.map((producto, idx) => {
      const medidaTexto = producto?.medida?.abreviatura || producto?.medida?.nombre || 'N/A';
      const { price, pct: incPct, base: baseRef } = computePriceWithTalla(producto, producto?.talla);
      const subtotal = (producto?.esConcentrado && Number(producto?.gramos || 0) > 0)
        ? (price / (Number(producto?.factorGramo || 1) || 1)) * Number(producto?.gramos || 0)
        : Number(producto?.cantidad || 0) * price;
      const pctGain = getGainPctForProduct(producto?.id, productosDisponibles);
      return [
        idx + 1,
        producto.nombre || 'Producto',
        producto.color || 'N/A',
        producto.talla || 'N/A',
        medidaTexto,
        String(producto.gramos || 'N/A'),
        String(producto.cantidad || 0),
        producto?.precioTalla != null ? formatearMoneda(price) : `${formatearMoneda(price)} (${formatearMoneda(baseRef)} + ${Number(incPct).toFixed(0)}%)`,
        `${Number.isFinite(pctGain) ? pctGain.toFixed(2) : '0.00'}%`,
        '0%',
        formatearMoneda(subtotal)
      ];
    }) || [];
    
    // Configuración especial para la tabla de productos
    const configTabla = {
      ...configuracionTabla,
      startY: yPos + 5,
      head: [encabezados],
      body: datosTabla,
      // Estilo compacto para más filas por página
      styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
      bodyStyles: { fontSize: 8, cellPadding: 3 },
      headStyles: {
        fillColor: COLORES.primario,
        textColor: [0, 0, 0],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 5
      },
      // Anchos recalculados para caber en el área útil (≈180mm)
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },   // #
        1: { cellWidth: 30, halign: 'left' },    // Producto
        2: { cellWidth: 12, halign: 'center' },  // Color
        3: { cellWidth: 12, halign: 'center' },  // Talla
        4: { cellWidth: 12, halign: 'center' },  // Medida
        5: { cellWidth: 13, halign: 'center' },  // Gramos
        6: { cellWidth: 13, halign: 'center' },  // Cantidad
        7: { cellWidth: 23, halign: 'right' },   // Precio Unit.
        8: { cellWidth: 17, halign: 'center' },  // Ganancia (%)
        9: { cellWidth: 15, halign: 'center' },  // Descuento
        10:{ cellWidth: 23, halign: 'right' }    // Subtotal
      },
      margin: { left: 15, right: 15 },
      // Asegurar salto automático de página por fila
      rowPageBreak: 'auto',
      showHead: 'everyPage'
    };
    
    // Generar tabla
    autoTable(doc, configTabla);
    
    // Calcular totales
    const subtotalGeneral = (venta.productos || []).reduce((acc, p) => {
      const { price } = computePriceWithTalla(p, p?.talla);
      const subtotal = (p.esConcentrado && Number(p.gramos || 0) > 0)
        ? (price / (Number(p.factorGramo || 1) || 1)) * Number(p.gramos || 0)
        : Number(p.cantidad || 0) * price;
      return acc + subtotal;
    }, 0);
    const descuentoGeneral = 0; // Por ahora sin descuentos
    const ivaGeneral = subtotalGeneral * 0.19;
    const totalGeneral = subtotalGeneral + ivaGeneral - descuentoGeneral;
    
    // Obtener posición Y después de la tabla
    const finalY = doc.lastAutoTable.finalY || yPos + 50;
    
    // Crear sección de totales con las nuevas utilidades
    const totales = {
      'Subtotal': subtotalGeneral,
      'Descuento': descuentoGeneral,
      'IVA (19%)': ivaGeneral,
      'TOTAL GENERAL': totalGeneral
    };
    
    const finalYTotales = crearSeccionTotales(doc, totales, finalY + 10);
    
    // Información adicional
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORES.textoSecundario);
    doc.text('* Los precios incluyen IVA cuando aplique', 15, finalYTotales + 10);
    doc.text('* Esta factura es válida como comprobante de compra', 15, finalYTotales + 15);
    
    // Mensaje de agradecimiento
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORES.texto);
    doc.text('¡Gracias por confiar en PetLove!', 105, finalYTotales + 25, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Cuidamos a tu mascota como si fuera nuestra', 105, finalYTotales + 30, { align: 'center' });
    
    // Crear pie de página mejorado
    crearPiePagina(doc);
    
    // Guardar PDF con nombre descriptivo
    const fechaFormateada = new Date(venta.fecha).toISOString().split('T')[0];
    const clienteNombreFile = (usuarioNombre || 'Cliente_General').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    doc.save(`Factura_Venta_${String(venta.id).padStart(6, '0')}_${clienteNombreFile}_${fechaFormateada}.pdf`);
    console.log('PDF generado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
    }
  };

  const generarPDFBasico = (venta) => {
    try {
      const doc = new jsPDF();
      const idFactura = String(venta?.numeroFactura || venta?.id || '').padStart(6, '0');
      const fecha = venta?.fecha ? formatearFecha(venta.fecha) : '';
      const cliente = venta?.cliente || 'Usuario';

      // Encabezado corporativo con amarillo Pet Love
      const inicioY = crearEncabezado(doc, 'FACTURA DE VENTA', `Factura No. ${idFactura}`, 'FACTURA');

      // Sección de información
      const datosVenta = {
        'Fecha de Venta': fecha,
        'Número de Factura': idFactura,
        'Estado': (venta?.estado || 'Activa').toUpperCase(),
        'Sucursal': EMPRESA_CONFIG.ciudad,
        'Vendedor': 'Sistema PetLove',
        'Forma de Pago': 'Efectivo'
      };
      let yPos = crearSeccionInformacion(doc, 'INFORMACIÓN DE LA VENTA', datosVenta, inicioY + 5, { columnas: 2, espaciado: 6, offsetValor: 28 });

      // Tabla de productos estilizada
      const encabezados = ['Producto', 'Cantidad', 'Precio Unit.', 'Ganancia (%)', 'Subtotal'];
      const datosTabla = (Array.isArray(venta?.productos) ? venta.productos : []).map(p => {
        const { price, pct: incPct, base: baseRef } = computePriceWithTalla(p, p?.talla);
        const subtotal = (p?.esConcentrado && Number(p?.gramos || 0) > 0)
          ? (price / (Number(p?.factorGramo || 1) || 1)) * Number(p?.gramos || 0)
          : Number(p?.cantidad || 0) * price;
        const pctGain = getGainPctForProduct(p?.id, productosDisponibles);
        return [
          p?.nombre || 'Producto',
          String(Number(p?.cantidad || 0)),
          p?.precioTalla != null ? formatearMoneda(price) : `${formatearMoneda(price)} (${formatearMoneda(baseRef)} + ${Number(incPct).toFixed(0)}%)`,
          `${Number.isFinite(pctGain) ? pctGain.toFixed(2) : '0.00'}%`,
          formatearMoneda(subtotal)
        ];
      });

      autoTable(doc, {
        ...configuracionTabla,
        head: [encabezados],
        body: datosTabla,
        startY: yPos + 5,
        headStyles: {
          ...configuracionTabla.headStyles,
          fillColor: COLORES.primario,
          textColor: [0, 0, 0]
        },
        columnStyles: {
          0: { cellWidth: 60, halign: 'left' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 30, halign: 'right' }
        },
        margin: { left: 15, right: 15 }
      });

      const subtotal = datosTabla.reduce((acc, row) => acc + Number((row[3] || '0').toString().replace(/[^0-9.-]/g, '')), 0) || 0;
      const iva = subtotal * 0.19;
      const total = subtotal + iva;

      const finalY = doc.lastAutoTable?.finalY || yPos + 50;
      const finalYTotales = crearSeccionTotales(doc, {
        'Subtotal': subtotal,
        'IVA (19%)': iva,
        'TOTAL GENERAL': total
      }, finalY + 10);

      // Pie de página corporativo
      crearPiePagina(doc);

      const fechaFormateada = venta?.fecha ? new Date(venta.fecha).toISOString().split('T')[0] : 'fecha';
      const clienteNombre = cliente.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      doc.save(`Factura_Venta_${idFactura}_${clienteNombre}_${fechaFormateada}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      Swal.fire({ icon: 'error', title: 'Error al generar PDF', text: error.message || 'Intenta de nuevo' });
    }
  };

  const confirmarPedido = async (id) => {
    const result = await Swal.fire({
      title: '¿Marcar como pagado?',
      text: 'Se convertirá en venta y se actualizará el stock',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2d5a27',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar'
    });
    if (result.isConfirmed) {
      setLoading(true);
      try {
        await pedidosService.confirmarPedido(id);
        setVentas(prev => prev.filter(v => Number(v.id) !== Number(id)));
        setVerDetalleOpen(false);
        setDetalleVenta(null);
        setBusqueda('');
        setPaginaActual(1);
        Swal.fire({
          icon: 'success',
          title: 'Pedido confirmado',
          text: 'El pedido fue marcado como pagado y se registró la venta',
          timer: 2500,
          showConfirmButton: false
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'No se pudo confirmar',
          text: error?.message || 'Intenta nuevamente'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const anularVenta = async (id) => {
    const result = await Swal.fire({
      title: '¿Anular esta venta?',
      text: 'Esta acción restaurará el stock de los productos y no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setVentas(prev => prev.map(v => v.id === id ? { ...v, estado: 'anulada' } : v));
      setLoading(true);
      try {
        // Usar el nuevo método del servicio que maneja la recuperación de stock
        await ventasService.anularVenta(id);
        
        // Recargar las ventas y productos para reflejar los cambios
        await cargarVentas();
        await cargarProductos();
        
        Swal.fire({
          icon: 'success',
          title: 'Venta anulada',
          text: 'La venta ha sido anulada correctamente y el stock restaurado',
          timer: 3000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error al anular venta:', error);
        const msg = String(error?.message || '').toLowerCase();
        if (msg.includes('ya') && msg.includes('anulad')) {
          Swal.fire({
            icon: 'info',
            title: 'Venta ya anulada',
            text: 'La venta ya estaba anulada previamente.',
            timer: 3000,
            showConfirmButton: false
          });
        } else if (msg.includes('409')) {
          Swal.fire({
            icon: 'info',
            title: 'Venta ya anulada',
            text: 'La venta ya estaba anulada previamente.',
            timer: 3000,
            showConfirmButton: false
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al anular venta',
            text: error.message || 'No se pudo anular la venta',
            timer: 4000,
            showConfirmButton: false
          });
        }
      } finally {
        setLoading(false);
        await cargarVentas();
        await cargarProductos();
      }
    }
  };

  const handleClickEstado = async (venta) => {
    if (!esAdmin) return;
    const estadoLc = String(venta.estado || '').toLowerCase();
    if (estadoLc === 'anulada') {
      const r = await Swal.fire({
        title: 'Reactivar venta',
        text: '¿Deseas reactivar esta venta?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Reactivar',
        cancelButtonText: 'Cancelar'
      });
      if (r.isConfirmed) {
        setLoading(true);
        try {
          await ventasService.cambiarEstadoVenta(venta.id, { estado: 'Completada' });
        } catch (err1) {
          try {
            await ventasService.actualizarVenta(venta.id, { estado: 'Completada' });
          } catch {}
        } finally {
          setLoading(false);
        }
        setVentas(prev => prev.map(v => v.id === venta.id ? { ...v, estado: 'Completada' } : v));
        await cargarVentas();
        Swal.fire({ icon: 'success', title: 'Venta reactivada', timer: 1800, showConfirmButton: false });
      }
      return;
    }
    const r = await Swal.fire({
      title: 'Cambiar estado',
      icon: 'question',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Pagado',
      denyButtonText: 'Pendiente',
      cancelButtonText: 'Cancelar'
    });
    let nuevoEstado = null;
    if (r.isConfirmed) nuevoEstado = 'Completada';
    else if (r.isDenied) nuevoEstado = 'Pendiente';
    if (!nuevoEstado) return;
    setLoading(true);
    try {
      await ventasService.cambiarEstadoVenta(venta.id, { estado: nuevoEstado });
    } catch (err1) {
      try {
        await ventasService.actualizarVenta(venta.id, { estado: nuevoEstado });
      } catch {}
    } finally {
      setLoading(false);
    }
    setVentas(prev => prev.map(v => v.id === venta.id ? { ...v, estado: nuevoEstado } : v));
    await cargarVentas();
    Swal.fire({ icon: 'success', title: 'Estado actualizado', timer: 1600, showConfirmButton: false });
  };


  return (
      <div className="ventas-page-container ventas-container">
         <div className="ventas-header">
          <div className="header-left">
            <h2>{displayTitle} <span className="contador-ventas">({ventasFiltradas.length})</span></h2>
          </div>
          <div className="header-right">
            <div className="acciones-globales">
              <input
                type="text"
                className="input-busqueda"
                placeholder="Buscar..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
              {String(filterByEstado || '').toLowerCase() !== 'pendiente' && esAdmin && (
                <button
                  className="btn btn-agregar"
                  title="Agregar venta"
                  onClick={() => setAgregarOpen(true)}
                >
                  Agregar venta
                </button>
              )}
            </div>
          </div>
        </div>

        {esAdmin && (
        <Dialog.Root open={agregarOpen} onOpenChange={setAgregarOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="dialog-overlay" />
            <Dialog.Content className="dialog-content dialog-agregar-venta">
              <Dialog.Close asChild>
                <button className="dialog-close" aria-label="Cerrar">&times;</button>
              </Dialog.Close>
              <Dialog.Title className="modal-titulo-base">Formulario de agregar venta</Dialog.Title>

              <div className="detalles-contenido">
                <div className="formulario-unico">
                  <div className="formulario-grid-vertical">
                    <div className="formulario-grid-vertical">
                      <div className="grupo-campo">
                        <label>Fecha <span style={{ color: 'red' }}>*</span></label>
                        <input
                          type="date"
                          value={nueva.fecha}
                          onChange={e => setNueva({ ...nueva, fecha: e.target.value })}
                          className="campo-estilizado"
                        />
                      </div>
                      <div className="grupo-campo">
                          <label>Cliente <span style={{ color: 'red' }}>*</span></label>
                        <select
                          value={nueva.usuarioId}
                          onChange={e => manejarSeleccionUsuario(e.target.value)}
                          className="campo-estilizado"
                        >
                          <option value="">Seleccione un cliente</option>
                          {clientes.map(cliente => (
                            <option key={cliente.id} value={cliente.id}>
                              {(cliente.nombres || cliente.nombre || '')} {(cliente.apellidos || '')} - {cliente.email || cliente.correo}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="formulario-grid-vertical">
                      <div className="grupo-campo">
                        <label>Producto <span style={{ color: 'red' }}>*</span></label>
                        <select
                          value={tempProducto.id}
                          onChange={e => manejarSeleccionProducto(e.target.value)}
                          className="campo-estilizado"
                        >
                          <option value="">Seleccione un producto</option>
                          {productosDisponibles.map(p => (
                            <option key={p.id || p.idProducto} value={p.id || p.idProducto}>
                              {p.nombreProducto || p.nombre} - {formatPriceCL(p.precio || 0)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grupo-campo">
                        <label>Cantidad a Comprar <span style={{ color: 'red' }}>*</span></label>
                        <input
                          type="number"
                          value={tempProducto.cantidad}
                          onChange={e => setTempProducto({ ...tempProducto, cantidad: e.target.value })}
                          placeholder="Cantidad"
                          min="1"
                          disabled={!tempProducto.id || tempProducto.stock <= 0}
                          className="campo-estilizado"
                          style={tempProducto.stock <= 0 && tempProducto.id ? { backgroundColor: '#ffebee', cursor: 'not-allowed' } : {}}
                        />
                      </div>
                    </div>

                    <div className="formulario-grid-vertical">
                      <div className="grupo-campo">
                        <label>Valor Unitario</label>
                        <input
                          type="text"
                          value={tempProducto.precio ? formatPriceCL(tempProducto.precio) : ''}
                          readOnly
                          placeholder="Seleccione un producto"
                          style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                          className="campo-estilizado"
                        />
                      </div>
                      <div className="grupo-campo">
                        <label>Stock Disponible</label>
                        <div className="stock-container">
                          {tempProducto.id ? (
                            tempProducto.stock > 0 ? (
                              <input
                                type="text"
                                value={`${tempProducto.stock} unidades`}
                                readOnly
                                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                className="campo-estilizado"
                              />
                            ) : (
                              <div className="sin-stock-mensaje">
                                <input
                                  type="text"
                                  value="No hay stock"
                                  readOnly
                                  style={{ backgroundColor: '#ffebee', cursor: 'not-allowed', color: '#d32f2f', fontWeight: 'bold', textAlign: 'center' }}
                                  className="campo-estilizado"
                                />
                              </div>
                            )
                          ) : (
                            <input
                              type="text"
                              value=""
                              readOnly
                              placeholder="Seleccione un producto"
                              style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                              className="campo-estilizado"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="formulario-grid-vertical">
                      <div className="grupo-campo">
                        <label>Color</label>
                        <select
                          value={tempProducto.color}
                          onChange={e => setTempProducto({ ...tempProducto, color: e.target.value })}
                          className="campo-estilizado"
                          disabled={!tempProducto.habilitaColor}
                        >
                          <option value="">Seleccione color</option>
                          {coloresDisponibles.map(c => (
                            <option key={c.idColor || c.id} value={c.nombre || c.Nombre}>
                              {c.nombre || c.Nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grupo-campo">
                        <label>Talla</label>
                        <select
                          value={tempProducto.talla}
                          onChange={e => {
                            const val = e.target.value;
                            setTempProducto(prev => ({ ...prev, talla: val }));
                            if (tempProducto.id && val) cargarPrecioTallaGuardado(tempProducto.id, val);
                          }}
                          className="campo-estilizado"
                          disabled={!tempProducto.habilitaTalla}
                        >
                          <option value="">Seleccione talla</option>
                          {tallasDisponibles.map(t => (
                            <option key={t.idTalla || t.id} value={t.nombre || t.Nombre}>
                              {t.nombre || t.Nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {tempProducto.talla && (
                      <div className="formulario-grid-vertical">
                        <div className="grupo-campo" style={{ gridColumn: '1 / -1' }}>
                          <label>Precio por talla</label>
                          <input
                            type="number"
                            value={tempProducto.precioTalla}
                            onChange={e => setTempProducto({ ...tempProducto, precioTalla: e.target.value })}
                            placeholder="Ej: 19990"
                            min="0"
                            className="campo-estilizado"
                          />
                        </div>
                      </div>
                    )}

                      <div className="formulario-grid-vertical">
                        <div className="grupo-campo">
                          <label>Valor Total</label>
                          <input
                            type="text"
                            value={(function(){
                            const precioBase = Number(tempProducto.precioTalla || tempProducto.precio || 0);
                            if (tempProducto.esConcentrado && Number(tempProducto.gramos || 0) > 0) {
                              const factor = Number(tempProducto.factorGramo || 1) || 1;
                              const total = (precioBase / factor) * Number(tempProducto.gramos || 0);
                              return formatPriceCL(total);
                            }
                            return (precioBase && Number(tempProducto.cantidad || 0)) ? formatPriceCL(precioBase * Number(tempProducto.cantidad || 0)) : '';
                            })()}
                            readOnly
                            placeholder="Ingrese cantidad"
                            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', fontWeight: 'bold', color: '#000000', textAlign: 'center' }}
                            className="campo-estilizado"
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.8rem' }}>
                        <button 
                          className={`btn ${tempProducto.stock <= 0 && tempProducto.id ? 'btn-deshabilitado' : 'btn-agregar'}`}
                          onClick={agregarProductoTemporal} 
                          title={tempProducto.stock <= 0 && tempProducto.id ? "No se puede agregar - Sin stock" : "Agregar producto"}
                          disabled={tempProducto.stock <= 0 && tempProducto.id}
                        >
                          {tempProducto.stock <= 0 && tempProducto.id ? 'Sin Stock' : 'Agregar Producto'}
                        </button>
                      </div>
                  </div>
                </div>
              </div>

              

              {productosVenta.length > 0 && (
                <div className="productos-temporales-card" style={{ gridColumn: '1 / -1' }}>
                  <div className="scroll-tabla-productos">
                    <table className="tabla-productos-temp">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          {productosVenta.some(p => !!p.color) && <th>Color</th>}
                          {productosVenta.some(p => !!p.talla) && <th>Talla</th>}
                          {productosVenta.some(p => !!(p.medida?.abreviatura || p.medida?.nombre)) && <th>Medida</th>}
                          {productosVenta.some(p => !!p.gramos) && <th>Gramos</th>}
                          <th>Precio Unit.</th>
                          <th>Cantidad</th>
                          <th>Subtotal</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productosVenta.map((p, i) => (
                          <tr key={`venta-producto-${p.id}-${i}`}>
                            <td>{p.nombre}</td>
                            {productosVenta.some(x => !!x.color) && <td>{p.color || ''}</td>}
                            {productosVenta.some(x => !!x.talla) && <td>{p.talla || ''}</td>}
                            {productosVenta.some(x => !!(x.medida?.abreviatura || x.medida?.nombre)) && <td>{p.medida?.abreviatura || p.medida?.nombre || ''}</td>}
                            {productosVenta.some(x => !!x.gramos) && <td>{p.gramos || ''}</td>}
                            <td>{formatPriceCL(Number(p.precioTalla ?? p.precio ?? 0))}</td>
                            <td>{p.cantidad}</td>
                            <td style={{ fontWeight: 'bold', color: '#2d5a27' }}>
                              {formatPriceCL((p.esConcentrado && Number(p.gramos || 0) > 0)
                                ? (Number(p.precioTalla ?? p.precio ?? 0) / (Number(p.factorGramo || 1) || 1)) * Number(p.gramos || 0)
                                : Number(p.cantidad || 0) * Number(p.precioTalla ?? p.precio ?? 0))}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
                                <button
                                  onClick={() => incrementarCantidad(p.id)}
                                  className="btn-icono btn-agregar-cantidad"
                                  title="Agregar unidad"
                                >
                                  <MdAdd size={16} />
                                </button>
                                <button
                                  onClick={() => decrementarCantidad(p.id)}
                                  className="btn-icono btn-disminuir-cantidad"
                                  title="Disminuir unidad"
                                >
                                  <MdRemove size={16} />
                                </button>
                                <button
                                  onClick={() => quitarProductoTemporal(p.id)}
                                  className="btn-icono btn-eliminar-producto"
                                  title="Quitar producto"
                                >
                                  <MdDelete size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              

              {productosVenta.length > 0 && (
                <div className="resumen-venta">
                  <div className="linea-resumen">
                    <span className="etiqueta-resumen">Subtotal:</span>
                    <span className="valor-resumen">{formatPriceCL(productosVenta.reduce((acc, p) => {
                      const base = Number(p.precioTalla ?? p.precio ?? 0);
                      return acc + (Number(p.cantidad || 0) * base);
                    }, 0))}</span>
                  </div>
                  <div className="linea-resumen total-final">
                    <span className="etiqueta-resumen">TOTAL:</span>
                    <span className="valor-resumen">{formatPriceCL(productosVenta.reduce((acc, p) => {
                      const base = Number(p.precioTalla ?? p.precio ?? 0);
                      return acc + (Number(p.cantidad || 0) * base);
                    }, 0))}</span>
                  </div>
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: '0.8rem' }}>
                <button
                  className="btn btn-confirmar"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAgregar();
                  }}
                  title="Crear venta"
                >
                  Crear venta
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        )}

        <div className="tabla-ventas-section">
          <div className="tabla-wrapper">
            <table className="tabla-ventas">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventasActuales.length > 0 ? (
                ventasActuales.map(v => (
                    <tr key={v.id}>
                      <td>{v.fecha}</td>
                      <td>{v.usuario}</td>
                      <td>
                        <ul className="lista-productos">
                          {(v.productos || []).map((p, i) => (
                            <li key={`producto-lista-${v.id}-${p.id || i}`}>{p.nombre} (x{p.cantidad})</li>
                          ))}
                        </ul>
                      </td>
                      <td>{formatPriceCL(v.total)}</td>
                      <td>
                        {String(filterByEstado || '').toLowerCase() === 'pendiente' ? (
                          esAdmin ? (
                            <span
                              className="estado-badge inactivo"
                              title="Habilitar venta"
                              onClick={() => confirmarPedido(v.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              Pendiente
                            </span>
                          ) : (
                            <span
                              className="estado-badge inactivo"
                              title="Pedido en proceso"
                              style={{ cursor: 'default' }}
                            >
                              En Proceso
                            </span>
                          )
                        ) : (
                          <span
                            className={`estado-badge ${String(v.estado || '').toLowerCase() === 'anulada' ? 'inactivo' : 'activo'}`}
                            onClick={() => esAdmin && handleClickEstado(v)}
                            title={esAdmin ? (String(v.estado || '').toLowerCase() === 'anulada' ? 'Reactivar venta' : 'Cambiar estado') : ''}
                            style={{ cursor: esAdmin ? 'pointer' : 'default' }}
                          >
                            {normalizarEstado(v.estado)}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="acciones-tabla">
                          <Dialog.Root open={verDetalleOpen && detalleVenta?.id === v.id} onOpenChange={setVerDetalleOpen}>
                            <Dialog.Trigger asChild>
                              <button
                                className="btn-icono btn-detalles"
                                title="Ver Detalles"
                                onClick={() => {
                                  setDetalleVenta(v);
                                  setVerDetalleOpen(true);
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#6b7280"/>
                                </svg>
                              </button>
                            </Dialog.Trigger>
                          <Dialog.Portal>
                            <Dialog.Overlay className="dialog-overlay" />
                            <Dialog.Content className="dialog-content dialog-detalles">
                                <Dialog.Close asChild>
                                  <button className="dialog-close" aria-label="Cerrar">&times;</button>
                                </Dialog.Close>
                                
                                <Dialog.Title className="modal-titulo-base">Detalle de la Venta #{v.id}</Dialog.Title>
                                
                                <div className="seccion-detalles-base">
                                  <h3 className="titulo-seccion-base">Información General</h3>
                                  <div className="formulario-dos-columnas-base">
                                    <div className="detalle-grupo-base">
                                      <label>Cliente:</label>
                                      <span>{v.usuario}</span>
                                    </div>
                                    <div className="detalle-grupo-base">
                                      <label>Fecha:</label>
                                      <span>{v.fecha}</span>
                                    </div>
                                    <div className="detalle-grupo-base">
                                      <label>Estado:</label>
                                      <span
                                        className={`estado-badge ${String(v.estado || '').toLowerCase() === 'anulada' ? 'inactivo' : 'activo'}`}
                                        onClick={() => esAdmin && handleClickEstado(v)}
                                        title={esAdmin ? (String(v.estado || '').toLowerCase() === 'anulada' ? 'Reactivar venta' : 'Cambiar estado') : ''}
                                        style={{ cursor: esAdmin ? 'pointer' : 'default' }}
                                      >
                                        {normalizarEstado(v.estado)}
                                      </span>
                                    </div>
                                    <div className="detalle-grupo-base">
                                      <label>Total:</label>
                                      <span className="total-destacado">{formatPriceCL(v.total)}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="seccion-detalles-base">
                                  <h3 className="titulo-seccion-base">Productos Vendidos</h3>
                                  <div className="tabla-productos-wrapper">
                                    <table className="tabla-productos-temp">
                                      <thead>
                                        <tr>
                                          <th>ID</th>
                                          <th>Producto</th>
                                          {(v.productos || []).some(p => !!p.color) && <th>Color</th>}
                                          {(v.productos || []).some(p => !!p.talla) && <th>Talla</th>}
                                          {(v.productos || []).some(p => !!(p.medida?.abreviatura || p.medida?.nombre)) && <th>Medida</th>}
                                          {(v.productos || []).some(p => !!p.gramos) && <th>Gramos</th>}
                                          <th>Cantidad</th>
                                          <th>Precio</th>
                                          <th>Subtotal</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(v.productos || []).map((p, i) => (
                                          <tr key={`detalle-venta-${v.id}-${p.id || i}`}>
                                            <td>{p.id}</td>
                                            <td>{p.nombre}</td>
                                            {(v.productos || []).some(x => !!x.color) && <td>{p.color || ''}</td>}
                                            {(v.productos || []).some(x => !!x.talla) && <td>{p.talla || ''}</td>}
                                            {(v.productos || []).some(x => !!(x.medida?.abreviatura || x.medida?.nombre)) && <td>{p.medida?.abreviatura || p.medida?.nombre || ''}</td>}
                                            {(v.productos || []).some(x => !!x.gramos) && <td>{p.gramos || ''}</td>}
                                            <td>{p.cantidad}</td>
                                            <td>{formatPriceCL(Number(p.precioTalla ?? p.precio ?? 0))}</td>
                                            <td>{formatPriceCL((p.esConcentrado && Number(p.gramos || 0) > 0)
                                              ? (Number(p.precioTalla ?? p.precio ?? 0) / (Number(p.factorGramo || 1) || 1)) * Number(p.gramos || 0)
                                              : Number(p.cantidad || 0) * Number(p.precioTalla ?? p.precio ?? 0))}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                                

                              </Dialog.Content>
                          </Dialog.Portal>
                        </Dialog.Root>
                          {!(String(filterByEstado || '').toLowerCase() === 'pendiente' && !esAdmin) && (
                            <>
                              <button className="btn btn-icon btn-pdf" onClick={() => generarPDF(v)} title="Generar PDF">
                                <MdPictureAsPdf size={12} />
                              </button>
                              {esAdmin && v.estado !== 'anulada' && v.estado !== 'Anulada' && (
                                <button 
                                  className="btn-icono btn-anular" 
                                  onClick={() => anularVenta(v.id)} 
                                  title="Anular Venta"
                                  disabled={loading}
                                >
                                  <MdClose size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="sin-resultados">No hay ventas registradas.</td>
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
            itemsPerPage={ventasPorPagina}
            totalItems={ventasFiltradas.length}
            showInfo={true}
          />
        </div>
    </div>
    );
};
export default VentasTable;

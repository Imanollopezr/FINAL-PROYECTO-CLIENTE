import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../../constants/apiConstants';
import './ComprasTable.scss';
import { MdRemoveRedEye, MdPictureAsPdf, MdAdd, MdCheck, MdClose } from "react-icons/md";
import { crearEncabezado, crearPiePagina, configuracionTabla, formatearMoneda, formatearFecha, COLORES, crearSeccionInformacion, crearSeccionTotales, EMPRESA_CONFIG } from '../../Utils/pdfUtils';
import { formatPriceCL, parsePriceCL } from '../../Utils/priceUtils';
import Pagination from '../shared/Pagination';
import proveedoresService from '../../services/proveedoresService';
import categoriasService from '../../services/categoriasService';

// Utilidad: normaliza un objeto de proveedor para soportar claves en PascalCase/camelCase
const normalizarProveedor = (p) => {
  if (!p) return {};
  const get = (a, b) => (a !== undefined && a !== null ? a : b);
  return {
    id: get(p.id, p.Id),
    nombre: get(get(p.nombre, p.Nombre), get(p.razonSocial, p.RazonSocial)) || get(p.nombres, p.Nombres) || '',
    razonSocial: get(p.razonSocial, p.RazonSocial) || '',
    nombres: get(p.nombres, p.Nombres) || '',
    apellidos: get(p.apellidos, p.Apellidos) || '',
    tipoPersona: get(p.tipoPersona, p.TipoPersona) || (p.RazonSocial ? 'juridica' : 'natural'),
    tipoDocumentoNombre: get(p.tipoDocumentoNombre, p.TipoDocumentoNombre) || '',
    tipoDocumento: get(p.tipoDocumento, p.TipoDocumento) || '',
    documento: get(get(p.documento, p.Documento), get(p.nit, p.NIT)) || '',
    nit: get(p.nit, p.NIT) || '',
    email: get(get(p.email, p.Email), get(p.correo, p.Correo)) || '',
    telefono: get(p.telefono, p.Telefono) || '',
    celular: get(p.celular, p.Celular) || '',
    direccion: get(p.direccion, p.Direccion) || '',
    ciudad: get(p.ciudad, p.Ciudad) || '',
    activo: get(p.activo, p.Activo) !== false
  };
};

const showSwalSafe = (closeDialogFn, config) => {
  if (closeDialogFn) closeDialogFn(false);
  setTimeout(() => {
    Swal.fire(config);
  }, 50);
};

// Utilidad robusta para parsear porcentajes (acepta "12", "12,5", "12%")
const parsePercent = (value) => {
  if (typeof value === 'number') return value;
  const clean = String(value ?? '')
    .trim()
    .replace('%', '')
    .replace(',', '.')
    .replace(/[^0-9.\-]/g, '');
  const n = parseFloat(clean);
  return Number.isFinite(n) ? n : 0;
};

// Formato compacto de fecha y hora para la tabla (DD/MM/YYYY HH:mm)
const formatDateDisplay = (value) => {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return String(value);
  }
};
const ComprasTable = () => {
  const [compras, setCompras] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [nuevo, setNuevo] = useState({ 
    fecha: new Date().toISOString().split('T')[0], 
    proveedor: '',
    proveedorId: '',
    total: 0
  });
  const [productosCompra, setProductosCompra] = useState([]);
  const [detalleCompra, setDetalleCompra] = useState(null);
  const [verDetalleOpen, setVerDetalleOpen] = useState(false);
  // Modal para agregar nueva compra
  const [agregarOpen, setAgregarOpen] = useState(false);
  // Paginación (alineado a Clientes)
  const [paginaActual, setPaginaActual] = useState(1);
  const [comprasPorPagina] = useState(5);
  const [tempProducto, setTempProducto] = useState({ nombre: '', cantidad: '', categoria: '', precio: '' });
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  const [mostrarProveedores, setMostrarProveedores] = useState(false);
  const [erroresCompra, setErroresCompra] = useState({ precio: '' });

  useEffect(() => {
    cargarCompras();
    cargarProductos();
    actualizarCategorias();
  }, []);

  const getGainPctForProduct = (id) => {
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

  // Función para cargar compras desde la API
  const cargarCompras = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/compras`);
      if (response.ok) {
        const data = await response.json();
        const comprasFormateadas = data.map(compra => ({
          id: compra.id,
          numeroFactura: compra.numeroFactura,
          proveedorId: compra.proveedorId,
          proveedor: compra.proveedor?.nombre || compra.proveedor?.razonSocial || compra.proveedor?.nombreEmpresa || 'Proveedor no encontrado',
          proveedorInfo: compra.proveedor || null,
          fecha: compra.fechaCompra,
          total: compra.total,
          estado: compra.estado,
          productos: compra.detallesCompra?.map(detalle => ({
            id: detalle.productoId,
            nombre: detalle.producto?.nombre || 'Producto no encontrado',
            cantidad: detalle.cantidad,
            precio: detalle.precioUnitario
          })),
          anulada: !compra.estado
        }));
        setCompras(comprasFormateadas);
      } else {
        console.error('Error al cargar compras:', response.statusText);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las compras',
          timer: 2000,
          timerProgressBar: true
        });
      }
    } catch (error) {
      console.error('Error al conectar con la API de compras:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor',
        timer: 2000,
        timerProgressBar: true
      });
    }
  };

  // Anular compra (revierte stock y elimina el registro en backend)
  const anularCompra = async (id) => {
    const result = await Swal.fire({
      title: '¿Anular esta compra?',
      text: 'Esta acción revertirá el stock agregado por esta compra y no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/compras/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error al anular compra: ${response.status} - ${errorText}`);
        }
        await cargarCompras();
        await cargarProductos();
        Swal.fire({
          icon: 'success',
          title: 'Compra anulada',
          text: 'La compra ha sido anulada correctamente y el stock revertido',
          timer: 3000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error al anular compra:', error);
        const msg = String(error?.message || '').toLowerCase();
        if (msg.includes('not found') || msg.includes('404')) {
          Swal.fire({
            icon: 'error',
            title: 'Compra no encontrada',
            text: 'No se pudo encontrar la compra para anular',
            timer: 3000,
            showConfirmButton: false
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al anular compra',
            text: error.message || 'No se pudo anular la compra',
            timer: 4000,
            showConfirmButton: false
          });
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // Función para cargar productos desde la API
  const cargarProductos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/productos`);
      if (response.ok) {
        const data = await response.json();
        setProductos(data);
      } else {
        console.error('Error al cargar productos:', response.statusText);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los productos',
          timer: 2000,
          timerProgressBar: true
        });
      }
    } catch (error) {
      console.error('Error al conectar con la API de productos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor de productos',
        timer: 2000,
        timerProgressBar: true
      });
    }
  };

  useEffect(() => {
    cargarCompras();
    cargarProductos();
    cargarProveedores();
    actualizarCategorias();
  }, []);

  // Función para cargar proveedores desde la API
  const cargarProveedores = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/proveedores`);
      if (response.ok) {
        const data = await response.json();
        const activos = data
          .filter(p => (p.activo === true || p.Activo === true))
          .map((p) => normalizarProveedor(p));
        setProveedores(activos);
      } else {
        console.error('Error al cargar proveedores:', response.statusText);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los proveedores',
          timer: 2000,
          timerProgressBar: true
        });
      }
    } catch (error) {
      console.error('Error al conectar con la API de proveedores:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor de proveedores',
        timer: 2000,
        timerProgressBar: true
      });
    }
  };

  const actualizarCategorias = async () => {
    try {
      const data = await categoriasService.obtenerCategorias();
      const activas = (Array.isArray(data) ? data : [])
        .filter(cat => cat.activo !== false)
        .map(cat => ({
          id: cat.id,
          nombre: cat.nombre,
          descripcion: cat.descripcion || `Categoría de ${cat.nombre}`
        }));
      setCategorias(activas);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setCategorias([]);
    }
  };

  const calcularTotalCompra = () => {
    return productosCompra.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
  };

  // Función para filtrar proveedores según la búsqueda
  const proveedoresFiltrados = proveedores.filter(proveedor =>
    proveedor.nombre.toLowerCase().includes(busquedaProveedor.toLowerCase()) ||
    (proveedor.email && proveedor.email.toLowerCase().includes(busquedaProveedor.toLowerCase()))
  );

  // Función para manejar la selección de proveedor
  const seleccionarProveedor = (proveedor) => {
    setNuevo({ ...nuevo, proveedor: proveedor.nombre });
    setBusquedaProveedor(proveedor.nombre);
    setMostrarProveedores(false);
  };

  const agregarProductoTemporal = async () => {
    const { nombre, cantidad } = tempProducto;
    const parsedCantidad = parseInt(cantidad);

    if (!nombre || isNaN(parsedCantidad)) {
      showSwalSafe(null, {
        icon: 'error',
        title: 'Error',
        text: 'Datos del producto inválidos.',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
      return;
    }

    if (productosCompra.some(p => p.nombre.toLowerCase() === nombre.toLowerCase())) {
      showSwalSafe(null, {
        icon: 'warning',
        title: 'Duplicado',
        text: 'Este producto ya fue agregado a esta compra.',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
      return;
    }

    // Nota: Se permite agregar productos existentes en inventario a las compras
    // La validación de duplicados solo aplica dentro de la misma compra

      setProductosCompra([
      ...productosCompra,
      {
        nombre,
        cantidad: parsedCantidad,
        categoria: tempProducto.categoria,
        precio: parsePriceCL(tempProducto.precio || 0)
      }
    ]);
    setTempProducto({ nombre: '', cantidad: '', categoria: '', precio: '' });
  };

  const quitarProductoTemporal = (index) => {
    const nuevosProductos = [...productosCompra];
    nuevosProductos.splice(index, 1);
    setProductosCompra(nuevosProductos);
  };



  const handleAgregar = async () => {
    const { fecha, proveedor, proveedorId } = nuevo;

    if (!fecha || !proveedor || productosCompra.length === 0) {
      showSwalSafe(null, {
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Completa todos los campos y agrega al menos un producto.',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
      return;
    }

    

    try {
      // Usar proveedorId si está disponible, de lo contrario buscar por nombre
      let proveedorEncontrado = null;
      if (proveedorId) {
        proveedorEncontrado = { id: parseInt(proveedorId) };
      } else {
        const proveedoresResponse = await fetch(`${API_BASE_URL}/api/proveedores`);
        if (!proveedoresResponse.ok) {
          throw new Error('Error al obtener proveedores');
        }
        const proveedoresData = await proveedoresResponse.json();
        proveedorEncontrado = proveedoresData.find(p => p.nombre.toLowerCase() === proveedor.toLowerCase());
        if (!proveedorEncontrado) {
          showSwalSafe(null, {
            icon: 'error',
            title: 'Error',
            text: 'Proveedor no encontrado.',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          });
          return;
        }
      }

      // Obtener todos los productos para mapear nombres a IDs
      const productosResponse = await fetch(`${API_BASE_URL}/api/productos`);
      if (!productosResponse.ok) {
        throw new Error('Error al obtener productos');
      }
      const productosData = await productosResponse.json();

      // Mapear productos de la compra con sus IDs
      const detallesCompraConIds = [];
      for (const productoCompra of productosCompra) {
        const productoEncontrado = productosData.find(p => 
          p.nombre.toLowerCase() === productoCompra.nombre.toLowerCase()
        );
        
        if (!productoEncontrado) {
          throw new Error(`Producto "${productoCompra.nombre}" no encontrado en el inventario`);
        }

        detallesCompraConIds.push({
          productoId: productoEncontrado.id,
          cantidad: productoCompra.cantidad,
          precioUnitario: productoCompra.precio,
          subtotal: productoCompra.cantidad * productoCompra.precio
        });
      }

      // Calcular totales
      const subtotal = productosCompra.reduce((acc, p) => acc + (p.cantidad * p.precio), 0);
      const impuestos = 0; // Sin IVA
      const total = subtotal + impuestos;

      // Preparar datos para la API
      const compraData = {
        proveedorId: proveedorEncontrado.id,
        fechaCompra: new Date(fecha).toISOString(),
        subtotal: subtotal,
        impuestos: impuestos,
        total: total,
        estado: "Completada",
        detallesCompra: detallesCompraConIds
      };

      // Enviar a la API
      const response = await fetch(`${API_BASE_URL}/api/compras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(compraData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error ${response.status}: ${errorData}`);
      }

      const compraCreada = await response.json();

      // Actualizar la lista local de compras
      const nuevaCompraLocal = {
        id: compraCreada.id,
        numeroFactura: compraCreada.numeroFactura,
        fecha,
        proveedor,
        proveedorInfo: compraCreada.proveedor || null,
        total,
        ganancia: detallesCompraConIds.reduce((acc, d) => {
          const pct = getGainPctForProduct(d.productoId);
          return acc + (Number(d.cantidad || 0) * Number(d.precioUnitario || 0) * (pct / 100));
        }, 0),
        productos: productosCompra
      };

      setCompras([...compras, nuevaCompraLocal]);
      setNuevo({ 
        fecha: new Date().toISOString().split('T')[0], 
        proveedor: '',
        proveedorId: '',
        total: 0
      });
      setProductosCompra([]);

      showSwalSafe(null, {
        icon: 'success',
        title: '¡Registrado!',
        text: 'La compra fue guardada correctamente en la base de datos.',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });

    } catch (error) {
      console.error('Error al guardar la compra:', error);
      showSwalSafe(null, {
        icon: 'error',
        title: 'Error',
        text: `No se pudo guardar la compra: ${error.message}`,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    }
  };

  const exportarCompraPDF = async (compra) => {
    console.log('Generando PDF para compra:', compra);
    try {
      const doc = new jsPDF();
      
    // Crear encabezado profesional con tipo de documento
    const numeroOrden = compra?.numeroFactura || String(compra.id).padStart(6, '0');
    const inicioContenido = crearEncabezado(doc, 'ORDEN DE COMPRA', `Orden No. ${numeroOrden}`, 'ORDEN DE COMPRA');
    
    // Información de la compra con diseño mejorado
    const datosCompra = {
      'Fecha de Compra': formatearFecha(compra.fecha),
      'Número de Orden': numeroOrden,
      'Estado': compra.anulada ? 'ANULADA' : 'ACTIVA',
      'Sucursal': EMPRESA_CONFIG.ciudad,
      'Responsable': 'Sistema PetLove',
      'Tipo de Compra': 'Inventario'
    };
    
    let yPos = crearSeccionInformacion(doc, 'INFORMACIÓN DE LA COMPRA', datosCompra, inicioContenido + 5, { columnas: 2, espaciado: 6, offsetValor: 28 });
    
    // Obtener información detallada del proveedor
    let proveedorDetallado = compra?.proveedorInfo || {};
    try {
      const proveedorId = (compra?.proveedorId || proveedorDetallado?.id);
      if (proveedorId) {
        const fullProv = await proveedoresService.obtenerProveedorPorId(proveedorId);
        proveedorDetallado = { ...proveedorDetallado, ...fullProv };
      }
      // Fallback: si faltan dirección/ciudad, buscar por nombre en lista local
      const provNormTemp = normalizarProveedor(proveedorDetallado);
      if (!provNormTemp?.direccion || !provNormTemp?.ciudad) {
        const nombreCompra = (compra?.proveedor || '').trim().toLowerCase();
        const encontrado = proveedores.find(p => (p.nombre || '').trim().toLowerCase() === nombreCompra);
        if (encontrado) proveedorDetallado = { ...encontrado, ...proveedorDetallado };
      }
    } catch (e) {
      console.warn('No fue posible enriquecer proveedor desde servicio:', e?.message || e);
    }

    // Normalizar proveedor para soportar claves PascalCase/camelCase
    const proveedorN = normalizarProveedor(proveedorDetallado);

    // Mapear campos para ambos tipos de persona
    const tipoPersona = proveedorN?.tipoPersona || (proveedorN?.razonSocial ? 'juridica' : 'natural');
    const nombreProveedor = tipoPersona === 'juridica'
      ? (proveedorN?.razonSocial || proveedorN?.nombre || 'Proveedor')
      : (proveedorN?.nombres || proveedorN?.nombre || 'Proveedor');

    const tipoDocumentoTexto = (() => {
      // Priorizar nombre de tipo de documento del API
      const tdNombre = proveedorN?.tipoDocumentoNombre;
      if (tdNombre) return tdNombre;
      const td = proveedorN?.tipoDocumento || '';
      if (td === 'CC') return 'Cédula de Ciudadanía';
      if (td === 'CE') return 'Cédula de Extranjería';
      if (td === 'NIT') return 'NIT';
      return td || 'Documento';
    })();

    const datosProveedor = {
      'Proveedor': nombreProveedor,
      'Tipo de Persona': tipoPersona === 'juridica' ? 'Jurídica' : 'Natural',
      'Tipo de Documento': tipoDocumentoTexto,
      'NIT/CC': proveedorN?.nit || proveedorN?.documento || 'N/A',
      'Teléfono': proveedorN?.telefono || proveedorN?.celular || 'N/A',
      'Email': proveedorN?.email || 'N/A',
      'Dirección': proveedorN?.direccion || 'N/A',
      'Ciudad': proveedorN?.ciudad || 'N/A',
      'Estado': proveedorN?.activo === false ? 'Inactivo' : 'Activo'
    };
    
    yPos = crearSeccionInformacion(doc, 'INFORMACIÓN DEL PROVEEDOR', datosProveedor, yPos + 5, { columnas: 2, espaciado: 6, offsetValor: 28 });
    
    // Detalle de productos con tabla mejorada
    const encabezados = ['#', 'Producto', 'Cantidad', 'Precio Unit.', 'Descuento', 'Subtotal'];
    const datosTabla = compra.productos?.map((producto, idx) => ([
      idx + 1,
      producto.nombre || 'Producto',
      (producto.cantidad || 0).toString(),
      formatearMoneda(producto.precio || 0),
      '0%',
      formatearMoneda((producto.cantidad || 0) * (producto.precio || 0))
    ])) || [];
    
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
        fillColor: COLORES.blanco,
        textColor: [0, 0, 0],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 5
      },
      // Anchos ajustados para caber en el área útil
      columnStyles: {
        0: { cellWidth: 8,  halign: 'center' }, // #
        1: { cellWidth: 58, halign: 'left' },   // Producto
        2: { cellWidth: 22, halign: 'center' }, // Cantidad
        3: { cellWidth: 34, halign: 'right' },  // Precio Unit.
        4: { cellWidth: 20, halign: 'center' }, // Descuento
        5: { cellWidth: 34, halign: 'right' }   // Subtotal
      },
      margin: { left: 15, right: 15 },
      rowPageBreak: 'auto',
      showHead: 'everyPage'
    };
    
    // Generar tabla
    autoTable(doc, configTabla);
    
    // Calcular totales
    const subtotalGeneral = compra.productos?.reduce((acc, p) => acc + ((p.cantidad || 0) * (p.precio || 0)), 0) || 0;
    const descuentoGeneral = 0; // Por ahora sin descuentos
    const ivaGeneral = 0; // Eliminado IVA en compras
    const totalGeneral = subtotalGeneral - descuentoGeneral;
    
    // Obtener posición Y después de la tabla
    const finalY = doc.lastAutoTable.finalY || yPos + 50;
    
    // Crear sección de totales con las nuevas utilidades
    const totales = {
      'Subtotal': subtotalGeneral,
      'Descuento': descuentoGeneral,
      'TOTAL GENERAL': totalGeneral
    };
    const finalYTotales = crearSeccionTotales(doc, totales, finalY + 10);
    
    // Información adicional
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORES.textoSecundario);
    doc.text('* Los precios de compra no incluyen IVA', 15, finalYTotales + 10);
    doc.text('* Esta orden de compra es válida como comprobante', 15, finalYTotales + 15);
    doc.text('* Favor confirmar recepción de esta orden', 15, finalYTotales + 20);
    
    // Mensaje de agradecimiento
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORES.texto);
    doc.text('¡Gracias por ser nuestro proveedor de confianza!', 105, finalYTotales + 30, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Juntos cuidamos a las mascotas', 105, finalYTotales + 35, { align: 'center' });
    
    // Crear pie de página mejorado
    crearPiePagina(doc);
    
    // Guardar con nombre descriptivo
    const fechaFormateada = new Date(compra.fecha).toISOString().split('T')[0];
    const nombreProveedorFile = (compra.proveedor || nombreProveedor || 'Proveedor_General').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    doc.save(`Orden_Compra_${numeroOrden}_${nombreProveedorFile}_${fechaFormateada}.pdf`);
    
    console.log('PDF de compra generado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF de compra:', error);
    }
  };

  const exportarCompraPDFBasico = (compra) => {
    try {
      const doc = new jsPDF();
      const idOrden = compra?.numeroFactura || String(compra?.id ?? '').padStart(6, '0');
      const fecha = compra?.fecha ? new Date(compra.fecha).toLocaleDateString() : '';
      const proveedor = compra?.proveedor || 'Proveedor';

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Orden de Compra', 105, 20, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Orden No.: ${idOrden}`, 15, 35);
      doc.text(`Fecha: ${fecha}`, 15, 43);
      doc.text(`Proveedor: ${proveedor}`, 15, 51);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalle de Productos', 15, 65);
      doc.setFont('helvetica', 'normal');

      let y = 73;
      const productos = Array.isArray(compra?.productos) ? compra.productos : [];
      productos.forEach((p, idx) => {
        const nombre = p?.nombre || `Producto ${idx + 1}`;
        const cantidad = Number(p?.cantidad || 0);
        const precio = Number(p?.precio || 0);
        const subtotal = cantidad * precio;
        doc.text(`${nombre}  |  Cant: ${cantidad}  |  Precio: ${precio.toLocaleString()}  |  Subtotal: ${subtotal.toLocaleString()}`, 15, y);
        y += 8;
        if (y > 270) { doc.addPage(); y = 20; }
      });

      const subtotalGeneral = productos.reduce((acc, p) => acc + (Number(p?.cantidad || 0) * Number(p?.precio || 0)), 0);
      const iva = 0;
      const total = subtotalGeneral;

      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.text(`Subtotal: ${subtotalGeneral.toLocaleString()}`, 15, y);
      y += 8;
      // IVA eliminado en compras
      y += 8;
      doc.text(`TOTAL: ${total.toLocaleString()}`, 15, y);

      const fechaFormateada = compra?.fecha ? new Date(compra.fecha).toISOString().split('T')[0] : 'fecha';
      const nombreProveedor = proveedor.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      doc.save(`Orden_Compra_${idOrden}_${nombreProveedor}_${fechaFormateada}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF de compra:', error);
      Swal.fire({ icon: 'error', title: 'Error al generar PDF', text: error.message || 'Intenta de nuevo' });
    }
  };



const comprasFiltradas = compras.filter((c) => {
    const q = busqueda.toLowerCase();
    return (
      (c.proveedor && c.proveedor.toLowerCase().includes(q)) ||
      (c.numeroFactura && c.numeroFactura.toLowerCase().includes(q)) ||
      String(c.id || '').includes(busqueda)
    );
});

  // Cálculo de páginas y slicing
  const indiceUltimaCompra = paginaActual * comprasPorPagina;
  const indicePrimeraCompra = indiceUltimaCompra - comprasPorPagina;
  const comprasActuales = comprasFiltradas.slice(indicePrimeraCompra, indiceUltimaCompra);
  const totalPaginas = Math.ceil(comprasFiltradas.length / comprasPorPagina) || 1;

  return (
    <div className="compras-container">
      <div className="compras-header">
        <div className="header-left">
          <h2>COMPRAS <span className="contador-compras">({comprasFiltradas.length})</span></h2>
        </div>
        <div className="header-right">
          <div className="acciones-globales">
          <input
            type="text"
            className="input-busqueda"
            placeholder="Buscar compra..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <Dialog.Root open={agregarOpen} onOpenChange={setAgregarOpen}>
            <Dialog.Trigger asChild>
              <button className="btn btn-agregar" title="Agregar compra">Agregar compra</button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="dialog-overlay" />
              <Dialog.Content className="dialog-content dialog-agregar">
                <Dialog.Close asChild>
                  <button className="dialog-close" aria-label="Cerrar">&times;</button>
                </Dialog.Close>
                <Dialog.Title className="modal-titulo-base">Formulario de agregar compra</Dialog.Title>
                <div className="detalles-contenido">
                  <div className="seccion-detalles-base">
                    <h3 className="titulo-seccion-base">Información General</h3>
                    <div className="formulario-dos-columnas-base">
                      <div className="detalle-grupo-base">
                        <label>Fecha</label>
                        <input
                          type="date"
                          value={nuevo.fecha}
                          onChange={(e) => setNuevo({ ...nuevo, fecha: e.target.value })}
                          className="campo-estilizado"
                        />
                      </div>
                      <div className="detalle-grupo-base">
                        <label>Proveedor</label>
                        <select
                          value={nuevo.proveedorId || ''}
                          onChange={(e) => {
                            const proveedorSeleccionado = proveedores.find(p => p.id === parseInt(e.target.value));
                            setNuevo({ 
                              ...nuevo, 
                              proveedorId: e.target.value,
                              proveedor: proveedorSeleccionado ? proveedorSeleccionado.nombre : ''
                            });
                          }}
                          className="campo-estilizado"
                        >
                          <option value="">Seleccione un proveedor</option>
                          {proveedores.map((proveedor, idx) => (
                            <option key={`proveedor-${proveedor.id ?? idx}`} value={proveedor.id}>
                              {proveedor.nombre} - {proveedor.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="seccion-detalles-base">
                    <h3 className="titulo-seccion-base">Productos</h3>
                    <div className="formulario-dos-columnas-base">
                      <div className="detalle-grupo-base">
                        <label>Producto</label>
                        <select
                          value={tempProducto.nombre}
                          onChange={(e) => {
                            const productoSeleccionado = productos.find(p => p.nombre === e.target.value);
                            setTempProducto({ 
                              ...tempProducto, 
                              nombre: e.target.value,
                              precio: productoSeleccionado ? productoSeleccionado.precio : tempProducto.precio,
                              categoria: productoSeleccionado?.categoria?.nombre || tempProducto.categoria
                            });
                          }}
                          className="campo-estilizado"
                        >
                          <option value="">Seleccione un producto</option>
                          {productos.map((producto, idx) => (
                            <option key={`producto-${producto.id ?? idx}`} value={producto.nombre}>
                              {producto.nombre} - {formatPriceCL(producto.precio)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="detalle-grupo-base">
                        <label>Cantidad</label>
                        <input
                          type="number"
                          value={tempProducto.cantidad}
                          onChange={(e) => setTempProducto({ ...tempProducto, cantidad: e.target.value })}
                          placeholder="Cantidad"
                          className="campo-estilizado"
                        />
                      </div>
                      <div className="detalle-grupo-base">
                        <label>Precio</label>
                        <input
                          type="text"
                          value={tempProducto.precio ? formatPriceCL(tempProducto.precio) : ''}
                          onChange={(e) => setTempProducto({ ...tempProducto, precio: formatPriceCL(e.target.value) })}
                          onBlur={() => {
                            const valNum = parsePriceCL(tempProducto.precio || 0);
                            const msg = !valNum || valNum <= 0 ? 'El precio debe ser mayor a 0.' : '';
                            setErroresCompra(prev => ({ ...prev, precio: msg }));
                          }}
                          placeholder="Ej: $12.500"
                          className={`campo-estilizado ${erroresCompra.precio ? 'error' : ''}`}
                        />
                        {erroresCompra.precio && (
                          <p className="error-text">{erroresCompra.precio}</p>
                        )}
                      </div>
                    </div>
                    <div className="detalle-grupo-boton">
                      <button
                        type="button"
                        className="btn btn-agregar-producto"
                        onClick={agregarProductoTemporal}
                        title="Agregar producto"
                      >
                        Agregar
                      </button>
                    </div>
                  {productosCompra.length > 0 && (
                    <div className="campo" style={{ gridColumn: '1 / -1' }}>
                      <div className="tabla-productos-wrapper">
                        <table className="tabla-productos-temp">
                          <thead>
                            <tr>
                              <th>Producto</th>
                              <th>Cantidad</th>
                              <th>Precio</th>
                              <th>Subtotal</th>
                              <th>Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productosCompra.map((p, idx) => (
                              <tr key={`producto-${idx}-${p.nombre}`}>
                                <td>{p.nombre}</td>
                                <td>{p.cantidad}</td>
                                <td>{formatPriceCL(p.precio)}</td>
                                <td>{formatPriceCL((p.precio || 0) * (p.cantidad || 0))}</td>
                                <td>
                                  <button
                                    onClick={() => quitarProductoTemporal(idx)}
                                    className="btn-quitar"
                                  >
                                    Quitar
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <div className="total-temp">
                    TOTAL DE LA COMPRA: ${calcularTotalCompra().toLocaleString()}
                  </div>
                  <div className="dialog-actions-centrado">
                    <button
                      className="btn btn-confirmar"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAgregar();
                        setAgregarOpen(false);
                      }}
                      title="Confirmar compra"
                    >
                      Confirmar
                    </button>
                  </div>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          </div>
        </div>
      </div>

      <div className="compras-layout">
        {/* Sección de formulario eliminada; ahora se usa modal para agregar compra */}

        <div className="tabla-compras-section">
          <div className="tabla-wrapper">
            <table className="tabla-compras">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {comprasActuales.length > 0 ? (
                  comprasActuales.map(c => (
                    <tr key={c.id}>
                      <td>{String(c.id).padStart(6, '0')}</td>
                      <td className="columna-fecha">{formatDateDisplay(c.fecha)}</td>
                      <td>{c.proveedor}</td>
                      <td className="columna-total">{formatPriceCL(c.total)}</td>
                      
                      <td>
                        <div className="acciones-tabla">
                          <Dialog.Root open={verDetalleOpen && detalleCompra?.id === c.id} onOpenChange={setVerDetalleOpen}>
                            <Dialog.Trigger asChild>
                              <button
                                className="btn-icono btn-detalles"
                                title="Ver Detalles"
                                onClick={() => {
                                  setDetalleCompra(c);
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
                                
                                <Dialog.Title className="modal-titulo-base">Detalle de la Compra {c.numeroFactura ? `Nº ${c.numeroFactura}` : `#${String(c.id).padStart(6, '0')}`}</Dialog.Title>
                                
                                <div className="seccion-detalles-base">
                                  <h3 className="titulo-seccion-base">Información General</h3>
                                  <div className="formulario-dos-columnas-base">
                                    <div className="detalle-grupo-base">
                                      <label>Proveedor:</label>
                                      <span>{c.proveedor}</span>
                                    </div>
                                    <div className="detalle-grupo-base">
                                      <label>Fecha:</label>
                                      <span>{c.fecha}</span>
                                    </div>
                                    <div className="detalle-grupo-base">
                                      <label>Estado:</label>
                                      <span className={`estado-badge ${c.anulada ? 'inactivo' : 'activo'}`}>
                                        {c.anulada ? 'Anulada' : 'Activa'}
                                      </span>
                                    </div>
                                    <div className="detalle-grupo-base">
                                      <label>Total:</label>
                                      <span className="total-destacado">{formatPriceCL(c.total)}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="seccion-detalles-base">
                                  <h3 className="titulo-seccion-base">Productos</h3>
                                  <div className="tabla-productos-wrapper">
                                    <table className="tabla-productos-temp">
                                      <thead>
                                        <tr>
                                          <th>Producto</th>
                                          <th>Cantidad</th>
                                          <th>Precio</th>
                                          <th>Subtotal</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {c.productos.map((p, i) => (
                                          <tr key={`detalle-${c.id}-${i}-${p.nombre}`}>
                                            <td>{p.nombre}</td>
                                            <td>{p.cantidad}</td>
                                            <td>{formatPriceCL(p.precio)}</td>
                                            <td>{formatPriceCL((p.cantidad || 0) * (p.precio || 0))}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                                

                              </Dialog.Content>
                          </Dialog.Portal>
                          </Dialog.Root>
                          <button className="btn btn-icon btn-pdf" onClick={() => exportarCompraPDF(c)} title="Generar PDF">
                            <MdPictureAsPdf size={12} />
                          </button>
                          {!c.anulada && (
                            <button 
                              className="btn-icono btn-anular" 
                              onClick={() => anularCompra(c.id)} 
                              title="Anular Compra"
                              disabled={loading}
                            >
                              <MdClose size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="sin-resultados">No se encontraron compras.</td>
                  </tr>
                )}
              </tbody>
              {/* Pie de tabla con Subtotal total */}
              <tfoot>
                {comprasActuales.length > 0 && (() => {
                  const subtotalCompras = comprasActuales.reduce((acc, c) => acc + (Number(c.total) || 0), 0);
                  return (
                    <tr>
                      <td></td>
                      <td></td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>Subtotal:</td>
                      <td style={{ fontWeight: 700 }}>{formatPriceCL(subtotalCompras)}</td>
                      <td></td>
                    </tr>
                  );
                })()}
              </tfoot>
            </table>
          </div>
        </div>

        <Pagination
          currentPage={paginaActual}
          totalPages={totalPaginas}
          onPageChange={setPaginaActual}
          itemsPerPage={comprasPorPagina}
          totalItems={comprasFiltradas.length}
          showInfo={true}
        />
      </div>
    </div>
  );
};

export default ComprasTable;

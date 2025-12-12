import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import * as Dialog from '@radix-ui/react-dialog';
import { API_BASE_URL, API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '../../constants/apiConstants';
import { getToken as getStoreToken } from '../../features/auth/tokenStore';
import Pagination from '../shared/Pagination';
import { 
  formatearFecha
} from '../../Utils/pdfUtils';
import './ProductosTable.scss';
import { formatPriceCL, parsePriceCL } from '../../Utils/priceUtils';

const showSwalSafe = (closeDialogFn, config) => {
  if (closeDialogFn) closeDialogFn(false);
  setTimeout(() => {
    Swal.fire(config);
  }, 50);
};

const ProductosTable = () => {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [nuevo, setNuevo] = useState({
    nombre: '', descripcion: '', precio: '', stock: '0', categoria: '', marca: '', medida: '', imagenUrl: '', imagenFile: null, activo: true, gananciaPct: '', medidaKg: '', medidaGr: '', color: ''
  });
  const [editando, setEditando] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [colores, setColores] = useState([]);
  const [medidas, setMedidas] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [verDetalleOpen, setVerDetalleOpen] = useState(false);
  const [detalleProducto, setDetalleProducto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const nombreInputRef = useRef(null);
  const [imagenPreviewUrl, setImagenPreviewUrl] = useState(null);
  

  // Helper para construir src de imagen desde API cuando es ruta relativa
  const buildImageSrc = (url) => {
    if (!url) return null;
    if (/^(https?:|data:|blob:)/i.test(url)) return url;
    let normalized = String(url).trim().replace(/^"+|"+$/g, '');
    normalized = normalized.replace(/\\/g, '/');
    normalized = normalized.replace(/^\.\/+/, '/');
    normalized = normalized.replace(/\/{2,}/g, '/');
    // Si el backend devuelve solo el nombre del archivo, asumir carpeta /uploads
    const isFileName = /^[\w\s.-]+\.(png|jpe?g|gif|webp|bmp)$/i.test(normalized);
    if (isFileName) {
      normalized = `uploads/${normalized}`;
    }
    // Si viene 'uploads/...' sin slash inicial, agregarlo
    if (/^uploads\//i.test(normalized)) {
      normalized = `/${normalized}`;
    }
    normalized = normalized.replace(/^\/?wwwroot\/?/i, '/');
    if (/^\/?Uploads\//.test(normalized)) {
      normalized = `/${normalized.replace(/^\/?Uploads\//, 'uploads/')}`;
    }
    // Asegurar slash inicial para rutas relativas
    const path = normalized.startsWith('/') ? normalized : `/${normalized}`;
    // En desarrollo, el proxy de Vite no cubre /uploads; usar backend directo
    const base = import.meta.env?.DEV
      ? (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8091').replace(/\/$/, '')
      : API_BASE_URL;
    return `${base}${path}`;
  };
  
  const getProductoImagenUrl = (p) => {
    const raw =
      p?.imagenUrl ??
      p?.ImagenUrl ??
      p?.imagenURL ??
      p?.imagen ??
      p?.urlImagen ??
      p?.imagenPath ??
      p?.imagenNombre ??
      p?.imagenArchivo ??
      '';
    return raw || '';
  };
  
  const getGainKey = (id) => `product-gain-pct:${id}`;
  const loadGainPct = (id) => {
    try {
      const raw = localStorage.getItem(getGainKey(id));
      const n = parseFloat(String(raw ?? '').trim());
      return Number.isFinite(n) ? Math.max(0, n) : 0;
    } catch {
      return 0;
    }
  };
  const saveGainPct = (id, pct) => {
    try {
      const v = Number.isFinite(pct) ? Math.max(0, pct) : 0;
      localStorage.setItem(getGainKey(id), String(v));
    } catch {}
  };
  
  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [productosPorPagina] = useState(5);
  const [productGanancias, setProductGanancias] = useState({});

  const updateProductGainPct = async (id, pct) => {
    const producto = productos?.find(p => p.id === id);
    if (!producto?.activo) {
      showSwalSafe(null, {
        icon: 'info',
        title: 'Producto inactivo',
        text: 'No puedes editar la ganancia de un producto inactivo. Actívalo para continuar.',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
      return;
    }
    try {
      const url = buildApiUrl(API_ENDPOINTS.PRODUCTOS.UPDATE.replace(':id', id));
      const response = await fetch(url, {
        method: 'PUT',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({ porcentajeGanancia: pct })
      });
      if (response.ok) {
        setProductos(prev => prev.map(p => (p.id === id ? { ...p, porcentajeGanancia: pct } : p)));
        saveGainPct(id, pct);
        showSwalSafe(null, {
          icon: 'success',
          title: 'Ganancia guardada',
          showConfirmButton: false,
          timer: 1200,
          timerProgressBar: true
        });
      } else {
        const txt = await response.text().catch(() => '');
        throw new Error(`Error ${response.status} ${txt}`);
      }
    } catch (err) {
      saveGainPct(id, pct);
      showSwalSafe(null, {
        icon: 'info',
        title: 'Guardado local',
        text: 'No se pudo sincronizar con el servidor. Se guardó localmente.',
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true
      });
    }
  };

  useEffect(() => {
    cargarProductos();
    cargarCategorias();
    cargarMarcas();
    cargarMedidas();
    cargarColores();
  }, []);

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const token = getStoreToken();
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };
      
      // Alinear con Clientes: incluir inactivos para que el registro no desaparezca al cambiar estado
      const response = await fetch(buildApiUrl(API_ENDPOINTS.PRODUCTOS.GET_ALL + '?includeInactive=true'), {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setProductos(data);
        const pg = {};
        (data || []).forEach(p => {
          const id = p?.id || p?.idProducto;
          const apiPct = parseFloat(String(p?.porcentajeGanancia ?? p?.gananciaPct ?? '').trim());
          const hasApiPct = Number.isFinite(apiPct) && apiPct >= 0;
          if (id) pg[id] = hasApiPct ? Math.min(100, apiPct) : loadGainPct(id);
        });
        setProductGanancias(pg);
      } else {
        throw new Error('Error al cargar productos');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los productos',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarCategorias = async () => {
    try {
      console.log('Cargando categorías desde:', buildApiUrl(API_ENDPOINTS.CATEGORIAS.GET_ALL));
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CATEGORIAS.GET_ALL), {
        method: 'GET',
        headers: DEFAULT_HEADERS
      });
      
      console.log('Respuesta de categorías:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Datos de categorías recibidos:', data);
        console.log('Estructura de primera categoría:', data[0]);
        // Filtrar solo categorías activas
        const categoriasActivas = data.filter(categoria => categoria.activo);
        console.log('Categorías activas:', categoriasActivas.length);
        setCategorias(categoriasActivas);
      } else {
        console.error('Error en respuesta de categorías:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Detalle del error:', errorText);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const cargarMarcas = async () => {
    try {
      console.log('Cargando marcas desde:', buildApiUrl(API_ENDPOINTS.MARCAS.GET_ALL + '?includeInactive=true'));
      const response = await fetch(buildApiUrl(API_ENDPOINTS.MARCAS.GET_ALL + '?includeInactive=true'), {
        method: 'GET',
        headers: DEFAULT_HEADERS
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Marcas cargadas:', data.length);
        setMarcas(data);
      } else {
        console.error('Error al cargar marcas:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error al cargar marcas:', error);
    }
  };

  const cargarMedidas = async () => {
    try {
      console.log('Cargando medidas desde:', buildApiUrl(API_ENDPOINTS.MEDIDAS.GET_ALL + '?includeInactive=true'));
      const response = await fetch(buildApiUrl(API_ENDPOINTS.MEDIDAS.GET_ALL + '?includeInactive=true'), {
        method: 'GET',
        headers: DEFAULT_HEADERS
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Medidas cargadas:', data.length);
        setMedidas(data);
      } else {
        console.error('Error al cargar medidas:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error al cargar medidas:', error);
    }
  };

  const cargarColores = async () => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.COLORES.GET_ALL), {
        method: 'GET',
        headers: DEFAULT_HEADERS
      });
      if (response.ok) {
        const data = await response.json();
        const normalizados = (Array.isArray(data) ? data : []).map((d) => ({
          idColor: d?.idColor ?? d?.IdColor ?? d?.id,
          nombre: d?.nombre ?? d?.Nombre ?? '',
          // Usar código de color normalizado en 'descripcion' para reutilizar lógica existente
          descripcion: d?.codigo ?? d?.Codigo ?? d?.descripcion ?? '',
          activo: (d?.activo ?? d?.Activo) !== false
        }));
        const activos = normalizados.filter(c => c.activo);
        setColores(activos);
      }
    } catch {}
  };

  // Helper para obtener ids robustamente
  const getIdFrom = (obj, keys = []) => {
    for (const k of keys) {
      const v = obj?.[k];
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
    }
    return '';
  };

  // Re-sincronizar selección al abrir edición cuando listas ya cargaron
  useEffect(() => {
    if (!editando) return;
    const categoriaId =
      getIdFrom(editando, ['idCategoriaProducto']) ||
      getIdFrom(editando?.categoria, ['idCategoriaProducto', 'IdCategoriaProducto', 'id']);
    const marcaId =
      getIdFrom(editando, ['idMarcaProducto']) ||
      getIdFrom(editando?.marca, ['idMarca', 'IdMarca', 'id']);
    const medidaId =
      getIdFrom(editando, ['idMedidaProducto']) ||
      getIdFrom(editando?.medida, ['idMedida', 'IdMedida', 'id']);
    const colorId = (() => {
      const desc = String(editando.descripcion || '');
      const m = desc.match(/Color:\s*([^•\(]+)\s*\(([^\)]+)\)/i);
      if (m) {
        const nombreColor = m[1].trim();
        const codigo = m[2].trim();
        let found = colores.find(c => String(c?.nombre || '').toLowerCase() === nombreColor.toLowerCase());
        if (!found) {
          found = colores.find(c => String(c?.descripcion || '').toLowerCase() === codigo.toLowerCase());
        }
        return found ? String(found.idColor ?? found.IdColor ?? found.id) : '';
      }
      return '';
    })();

    setNuevo(prev => ({
      ...prev,
      categoria: categoriaId,
      marca: marcaId,
      medida: medidaId,
      color: colorId
    }));
  }, [editando, categorias, marcas, medidas, colores]);





  const productosFiltrados = productos.filter(p =>
    (p.nombre + ' ' + (p.categoria?.nombre || '') + ' ' + p.descripcion + ' ' + p.precio + ' ' + p.stock)
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  // Paginación
  const indiceUltimoProducto = paginaActual * productosPorPagina;
  const indicePrimerProducto = indiceUltimoProducto - productosPorPagina;
  const productosActuales = productosFiltrados.slice(indicePrimerProducto, indiceUltimoProducto);
  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const toggleEstado = async (id) => {
    const producto = productos.find(p => p.id === id);

    Swal.fire({
      title: producto.activo 
        ? '¿Estás seguro de desactivar este producto?'
        : '¿Estás seguro de activar este producto?',
      text: producto.activo 
        ? 'El producto pasará a estar inactivo.'
        : 'El producto pasará a estar activo nuevamente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: producto.activo ? 'Sí, desactivar' : 'Sí, activar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setUpdatingId(id);
        setLoading(true);
        try {
          const token = getStoreToken();
          const headers = token ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` } : { ...DEFAULT_HEADERS };
          const response = await fetch(buildApiUrl(`/api/productos/${id}/estado`), {
            method: 'PATCH',
            headers,
            credentials: 'include',
            body: JSON.stringify({ activo: !producto.activo })
          });

          if (response.ok) {
            await cargarProductos();
            showSwalSafe(null, {
              icon: 'success',
              title: producto.activo 
                ? `Producto ${producto.nombre} (ID ${id}) desactivado correctamente`
                : `Producto ${producto.nombre} (ID ${id}) activado correctamente`,
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true
            });
          } else {
            throw new Error('Error al actualizar producto');
          }
        } catch (error) {
          console.error('Error:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `No se pudo actualizar el estado de ${producto.nombre} (ID ${id}).`,
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          });
        } finally {
          setUpdatingId(null);
          setLoading(false);
        }
      }
    });
  };

  const handleAgregar = async () => {
    const { nombre, descripcion, precio, stock, categoria, marca, medida, medidaKg, medidaGr, color, imagenUrl, imagenFile, activo } = nuevo;

    console.log('Validando campos:', { nombre, descripcion, precio, stock, categoria, marca, medida, imagenUrl, activo });

    if (!nombre || !categoria || !marca || !medida || !precio) {
      showSwalSafe(null, {
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Completa todos los campos requeridos: nombre, categoría, marca, medida y precio.',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
      return;
    }

    setLoading(true);
    try {
      const pctVal = parseFloat(String(nuevo.gananciaPct ?? '').trim());
      const pctNorm = Number.isFinite(pctVal) ? Math.min(100, Math.max(0, pctVal)) : 0;
      // Construir descripción con anotación de medida
      const descripcionFinal = buildDescripcionConDimensiones(descripcion, medida, medidaKg, medidaGr, color);
      if (editando) {
        const productId = editando.id || editando.idProducto;

        // Si se seleccionó una nueva imagen en edición, subirla primero y usar la URL devuelta
        let imagenUrlFinal = imagenUrl || '';
        if (imagenFile) {
          try {
            const token = localStorage.getItem('authToken');
            const fd = new FormData();
            fd.append('archivo', imagenFile);
            const uploadResp = await fetch(buildApiUrl(API_ENDPOINTS.ARCHIVOS.SUBIR_IMAGEN), {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              },
              credentials: 'include',
              body: fd
            });
            if (uploadResp.ok) {
              const uploadData = await uploadResp.json();
              imagenUrlFinal = uploadData.url || imagenUrlFinal;
            } else {
              const errText = await uploadResp.text().catch(() => '');
              throw new Error(`Error al subir imagen: ${uploadResp.status} ${errText}`);
            }
          } catch (uploadError) {
            console.error('Error al subir imagen en edición:', uploadError);
            showSwalSafe(null, {
              icon: 'error',
              title: 'Error al subir imagen',
              text: uploadError.message || 'No se pudo subir la imagen seleccionada.',
              showConfirmButton: false,
              timer: 2500,
              timerProgressBar: true
            });
            setLoading(false);
            return;
          }
        }

        const productoActualizado = {
          id: productId,
          nombre: nuevo.nombre,
          descripcion: descripcionFinal || '',
          precio: parsePriceCL(nuevo.precio),
          idCategoriaProducto: parseInt(nuevo.categoria),
          idMarcaProducto: parseInt(nuevo.marca),
          idMedidaProducto: parseInt(nuevo.medida),
          imagenUrl: imagenUrlFinal,
          activo: nuevo.activo,
          porcentajeGanancia: pctNorm
        };
        
        const updateUrl = buildApiUrl(API_ENDPOINTS.PRODUCTOS.UPDATE.replace(':id', productId));
        console.log('Actualizando producto:', { productId, updateUrl, productoActualizado });
        
        const token = getStoreToken();
        const headers = token ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` } : { ...DEFAULT_HEADERS };
        const response = await fetch(updateUrl, {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify(productoActualizado)
        });

        if (response.ok) {
          await cargarProductos();
          if (productId) {
            saveGainPct(productId, pctNorm);
          }
          setEditando(null);
          setMostrarFormulario(false);
          showSwalSafe(null, {
            icon: 'success',
            title: 'Producto actualizado correctamente',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          });
        } else {
          const errorData = await response.text();
          console.error('Error al actualizar producto:', response.status, errorData);
          throw new Error(`Error al actualizar producto: ${response.status}`);
        }
      } else {
        const nuevoProducto = {
          nombre: nuevo.nombre,
          descripcion: descripcionFinal || '',
          precio: parsePriceCL(nuevo.precio),
          stock: 0,
          idCategoriaProducto: parseInt(nuevo.categoria),
          idMarcaProducto: parseInt(nuevo.marca),
          idMedidaProducto: parseInt(nuevo.medida),
          imagenUrl: nuevo.imagenUrl || '',
          activo: true,
          porcentajeGanancia: pctNorm
        };
        
        console.log('=== DATOS QUE SE ENVÍAN AL BACKEND ===');
        console.log('Objeto completo:', nuevoProducto);
        console.log('JSON stringificado:', JSON.stringify(nuevoProducto, null, 2));
        console.log('===============================================');
        
        // Si hay imagen local seleccionada, usar endpoint multipart
        if (imagenFile) {
          const token = localStorage.getItem('authToken');
          const formData = new FormData();
          formData.append('Nombre', nuevo.nombre);
          formData.append('Descripcion', descripcionFinal || '');
          formData.append('Precio', parsePriceCL(nuevo.precio));
          formData.append('Stock', 0);
          formData.append('IdCategoriaProducto', parseInt(nuevo.categoria));
          formData.append('IdMarcaProducto', parseInt(nuevo.marca));
          formData.append('IdMedidaProducto', parseInt(nuevo.medida));
          formData.append('Imagen', imagenFile, imagenFile.name);
          formData.append('Activo', 'true');
          formData.append('PorcentajeGanancia', String(pctNorm));

          const response = await fetch(buildApiUrl(API_ENDPOINTS.PRODUCTOS.CREATE_WITH_IMAGE), {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
            credentials: 'include',
            body: formData
          });

          if (response.ok) {
            const responseData = await response.json();
            console.log('Producto creado con imagen exitosamente:', responseData);
            const createdId = responseData?.id || responseData?.idProducto;
            if (createdId) {
              saveGainPct(createdId, pctNorm);
            }
            await cargarProductos();
            showSwalSafe(null, {
              icon: 'success',
              title: 'Producto agregado correctamente',
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true
            });
            resetFormulario();
            setMostrarFormulario(false);
          } else {
            const errorText = await response.text();
            console.error('Error al crear producto con imagen:', response.status, errorText);
            throw new Error(`Error al crear producto: ${response.status} - ${errorText}`);
          }
        } else {
          // Sin imagen, usar el endpoint JSON existente
          const token = getStoreToken();
          const headers = token ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` } : { ...DEFAULT_HEADERS };
          const response = await fetch(buildApiUrl(API_ENDPOINTS.PRODUCTOS.CREATE), {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify(nuevoProducto)
          });

          if (response.ok) {
            const responseData = await response.json();
            console.log('Producto creado exitosamente:', responseData);
            const createdId = responseData?.id || responseData?.idProducto;
            if (createdId) {
              saveGainPct(createdId, pctNorm);
            }
            await cargarProductos();
            showSwalSafe(null, {
              icon: 'success',
              title: 'Producto agregado correctamente',
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true
            });
            resetFormulario();
            setMostrarFormulario(false);
          } else {
            const errorText = await response.text();
            console.error('Error al crear producto:', response.status, errorText);
            throw new Error(`Error al crear producto: ${response.status} - ${errorText}`);
          }
        }
      }
    } catch (error) {
      console.error('Error en operación de producto:', error);
      showSwalSafe(null, {
        icon: 'error',
        title: 'Error',
        text: error.message || 'Ocurrió un error al procesar el producto.',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });
    } finally {
      setLoading(false);
    }
  };

  const editarProducto = (producto) => {
    if (producto && producto.activo === false) {
      Swal.fire({
        icon: 'info',
        title: 'Producto inactivo',
        text: 'No puedes editar un producto inactivo. Actívalo para continuar.',
        timer: 2500,
        showConfirmButton: false
      });
      return;
    }
    setNuevo({
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: producto.precio || '',
      stock: producto.stock || '',
      categoria: String(producto.idCategoriaProducto ?? producto.categoria?.idCategoriaProducto ?? ''),
      marca: String(producto.idMarcaProducto ?? producto.marca?.idMarca ?? ''),
      medida: String(producto.idMedidaProducto ?? producto.medida?.idMedida ?? ''),
      color: (() => {
        const desc = String(producto.descripcion || '');
        const m = desc.match(/Color:\s*([^•\(]+)\s*\(([^\)]+)\)/i);
        if (m) {
          const nombreColor = m[1].trim();
          const codigo = m[2].trim();
          let found = colores.find(c => String(c?.nombre || '').toLowerCase() === nombreColor.toLowerCase());
          if (!found) {
            found = colores.find(c => String(c?.descripcion || '').toLowerCase() === codigo.toLowerCase());
          }
          return found ? String(found.idColor ?? found.IdColor ?? found.id) : '';
        }
        return '';
      })(),
      imagenUrl: producto.imagenUrl || '',
      activo: producto.activo !== undefined ? producto.activo : true,
      gananciaPct: (() => {
        const apiPct = parseFloat(String(producto?.porcentajeGanancia ?? producto?.gananciaPct ?? '').trim());
        if (Number.isFinite(apiPct) && apiPct >= 0) return String(apiPct);
        const pid = producto?.id || producto?.idProducto;
        return pid ? String(productGanancias[pid] ?? '') : '';
      })()
    });
    setEditando(producto);
    
    setMostrarFormulario(true);
  }

  const eliminarProducto = async (id) => {
    const producto = productos.find(p => p.id === id);
    if (producto && producto.activo === false) {
      Swal.fire({
        icon: 'info',
        title: 'Acción no disponible',
        text: 'No se puede eliminar un producto inactivo. Actívalo para gestionar cambios.',
        timer: 2500,
        showConfirmButton: false
      });
      return;
    }
    const result = await Swal.fire({
      title: `¿Eliminar producto ${producto?.nombre} (ID ${id})?`,
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
        const token = getStoreToken();
        const headers = token ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` } : { ...DEFAULT_HEADERS };
        const response = await fetch(buildApiUrl(`/api/productos/${id}`), {
          method: 'DELETE',
          headers,
          credentials: 'include'
        });
        
        if (response.ok) {
          await cargarProductos();
          Swal.fire({
            icon: 'success',
            title: 'Producto eliminado',
            text: `Se eliminó correctamente: ${producto?.nombre} (ID ${id}).`,
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          // Intentar obtener el mensaje específico del error
          let errorMessage = `Error ${response.status}: ${response.statusText}`;
          
          try {
            const errorData = await response.json();
            if (errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (parseError) {
            // Si no se puede parsear el JSON, usar el mensaje por defecto
          }
          
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar producto',
          text: error.message || `No se pudo eliminar el producto (ID ${id}).`,
          timer: 4000,
          showConfirmButton: false
        });
      } finally {
        setDeletingId(null);
        setLoading(false);
      }
    }
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setMostrarFormulario(false);
    setNuevo({ nombre: '', descripcion: '', precio: '', stock: '', categoria: '', marca: '', medida: '', medidaKg: '', medidaGr: '', color: '', imagenUrl: '', imagenFile: null, activo: true, gananciaPct: '' });
    if (imagenPreviewUrl) {
      try { URL.revokeObjectURL(imagenPreviewUrl); } catch {}
      setImagenPreviewUrl(null);
    }
  };

  const resetFormulario = () => {
    setNuevo({ nombre: '', descripcion: '', precio: '', stock: '', categoria: '', marca: '', medida: '', medidaKg: '', medidaGr: '', imagenUrl: '', imagenFile: null, activo: true, gananciaPct: '' });
    setEditando(null);
  };

  // Construye una descripción anotada con la medida seleccionada.
  // Si se selecciona Kilogramo/Gramo y hay valor, se incluye el peso/cantidad.
  const esKilogramoSeleccionado = (medidaId) => {
    const medidaSel = medidas?.find(m => String(m?.idMedida) === String(medidaId));
    if (!medidaSel) return false;
    const n = (medidaSel.nombre || '').toLowerCase();
    const a = (medidaSel.abreviatura || '').toLowerCase();
    return /kilo|kilogram/.test(n) || a === 'kg';
  };

  const esGramoSeleccionado = (medidaId) => {
    const medidaSel = medidas?.find(m => String(m?.idMedida) === String(medidaId));
    if (!medidaSel) return false;
    const n = (medidaSel.nombre || '').toLowerCase();
    const a = (medidaSel.abreviatura || '').toLowerCase();
    return /gramo|gram/.test(n) || a === 'g';
  };

  const esColorDeshabilitadoPorCategoria = (categoriaId) => {
    const cat = categorias?.find(c => String(c?.idCategoriaProducto) === String(categoriaId));
    const nombre = (cat?.nombre || '').toLowerCase();
    return /(cuido|alimento|comida|snack)/.test(nombre);
  };

  const buildDescripcionConDimensiones = (baseDescripcion, medidaId, medidaKg, medidaGr, colorId) => {
    const desc = (baseDescripcion || '').trim();
    const medidaMarcada = /Medida:/i.test(desc);
    const colorMarcado = /Color:/i.test(desc);
    const medidaSel = medidas?.find(m => String(m?.idMedida) === String(medidaId));
    let partes = [desc];
    if (medidaSel) {
      let notaMedida = `Medida: ${medidaSel.nombre}${medidaSel.abreviatura ? ` (${medidaSel.abreviatura})` : ''}`;
      if (esKilogramoSeleccionado(medidaId) && medidaKg) {
        notaMedida = `Medida: Kilogramo (${medidaKg} kg)`;
      } else if (esGramoSeleccionado(medidaId) && medidaGr) {
        notaMedida = `Medida: Gramo (${medidaGr} g)`;
      }
      if (!medidaMarcada) {
        partes.push(notaMedida);
      }
    }
    const colorSel = colores?.find(c => String(c?.idColor ?? c?.IdColor ?? c?.id) === String(colorId));
    if (colorSel && !colorMarcado) {
      const notaColor = `Color: ${colorSel.nombre}${colorSel.descripcion ? ` (${colorSel.descripcion})` : ''}`;
      partes.push(notaColor);
    }
    const texto = partes.filter(p => p && p.trim()).join(' • ');
    return texto;
  };

  const cambiarEstado = (id, nuevoEstado) => {
    const actualizados = productos.map(p => p.id === id ? { ...p, activo: nuevoEstado } : p);
    guardarProductos(actualizados);
  };

  // Reporte PDF eliminado según solicitud

  return (
    <div className="productos-page-container">
      <div className="productos-container">
        <div className="productos-header">
          <div className="header-left">
            <h2>Gestión de Productos <span className="contador-productos">{productosFiltrados.length}</span></h2>
          </div>
          <div className="header-right">
            <input
              type="text"
              className="input-busqueda"
              placeholder="Buscar por nombre, categoría, descripción, precio o stock"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            <button 
              className="btn-agregar" 
              onClick={() => setMostrarFormulario(true)}
              disabled={loading}
            >
              + Agregar Producto
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
             <Dialog.Content
               className="dialog-content"
               aria-describedby="producto-modal-desc"
               role="dialog"
               aria-modal="true"
               tabIndex={-1}
               onOpenAutoFocus={(e) => {
                 e.preventDefault();
                 nombreInputRef.current?.focus();
               }}
               onEscapeKeyDown={(e) => { e.preventDefault(); }}
               onInteractOutside={(e) => { e.preventDefault(); }}
             >
               <Dialog.Close asChild>
                 <button className="dialog-close-unified" aria-label="Cerrar modal" type="button">
                   &times;
                 </button>
               </Dialog.Close>
               
              <Dialog.Title className="dialog-title">
                 {editando ? 'Editar Producto' : 'Formulario de agregar producto'}
              </Dialog.Title>

              <div className="formulario-vertical">
                <div className="campo-moderno">
                  <label>Nombre del Producto <span className="requerido">*</span></label>
                  <input
                    type="text"
                    value={nuevo.nombre}
                    onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })}
                    placeholder="Ingrese el nombre del producto"
                    className="input-moderno"
                    ref={nombreInputRef}
                  />
                </div>

                <div className="campo-moderno">
                  <label>Descripción</label>
                  <textarea
                    value={nuevo.descripcion}
                    onChange={e => setNuevo({ ...nuevo, descripcion: e.target.value })}
                    placeholder="Descripción del producto"
                    className="input-moderno"
                    rows="4"
                  />
                </div>

                <div className="campo-moderno">
                  <label>Categoría <span className="requerido">*</span></label>
                  <select
                    value={nuevo.categoria}
                    onChange={e => {
                      const val = e.target.value;
                      const disableColor = esColorDeshabilitadoPorCategoria(val);
                      setNuevo({ 
                        ...nuevo, 
                        categoria: val,
                        color: disableColor ? '' : nuevo.color
                      });
                    }}
                    className="input-moderno"
                  >
                    <option value="">Seleccione categoría</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.idCategoriaProducto} value={String(categoria.idCategoriaProducto)}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="campo-moderno">
                  <label>Marca <span className="requerido">*</span></label>
                  <select
                    value={nuevo.marca}
                    onChange={e => setNuevo({ ...nuevo, marca: e.target.value })}
                    className="input-moderno"
                  >
                    <option value="">Seleccione marca</option>
                    {marcas.map((marca) => (
                      <option key={marca.idMarca} value={String(marca.idMarca)}>
                        {marca.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="campo-moderno">
                  <label>Medida <span className="requerido">*</span></label>
                  <select
                    value={nuevo.medida}
                    onChange={e => {
                      const idSel = e.target.value;
                      setNuevo({
                        ...nuevo,
                        medida: idSel,
                        medidaKg: esKilogramoSeleccionado(idSel) ? (nuevo.medidaKg || '') : '',
                        medidaGr: esGramoSeleccionado(idSel) ? (nuevo.medidaGr || '') : ''
                      });
                    }}
                    className="input-moderno"
                  >
                    <option value="">Seleccione medida</option>
                    {medidas.map((medida) => (
                      <option key={medida.idMedida} value={String(medida.idMedida)}>
                        {medida.nombre} ({medida.abreviatura})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="campo-moderno">
                  <label>Color</label>
                  <select
                    value={nuevo.color}
                    onChange={e => setNuevo({ ...nuevo, color: e.target.value })}
                    className={`input-moderno ${esColorDeshabilitadoPorCategoria(nuevo.categoria) ? 'input-disabled' : ''}`}
                    disabled={esColorDeshabilitadoPorCategoria(nuevo.categoria)}
                    title={esColorDeshabilitadoPorCategoria(nuevo.categoria) ? 'Campo no editable' : undefined}
                  >
                    <option value="">Seleccione color</option>
                    {colores.map((color) => (
                      <option key={(color.idColor ?? color.IdColor ?? color.id)} value={String(color.idColor ?? color.IdColor ?? color.id)}>
                        {color.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {esKilogramoSeleccionado(nuevo.medida) && (
                  <div className="campo-moderno">
                    <label>Kilogramos</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ingrese el peso en kg"
                      value={nuevo.medidaKg || ''}
                      onChange={(e) => {
                        const kg = e.target.value;
                        const gr = kg ? String(Math.round(parseFloat(kg) * 1000)) : '';
                        setNuevo({ ...nuevo, medidaKg: kg, medidaGr: gr });
                      }}
                      className="input-moderno"
                    />
                  </div>
                )}
                {esKilogramoSeleccionado(nuevo.medida) && (
                  <div className="campo-moderno">
                    <label>Gramos</label>
                    <input
                      type="number"
                      value={nuevo.medidaGr || ''}
                      readOnly
                      className="input-moderno input-disabled"
                      title="Campo no editable"
                    />
                  </div>
                )}

                {esGramoSeleccionado(nuevo.medida) && !esKilogramoSeleccionado(nuevo.medida) && (
                  <div className="campo-moderno">
                    <label>Gramos</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="Ingrese la cantidad en g"
                      value={nuevo.medidaGr || ''}
                      onChange={(e) => setNuevo({ ...nuevo, medidaGr: e.target.value })}
                      className="input-moderno"
                    />
                  </div>
                )}

                <div className="campo-moderno">
                  <label>Precio <span className="requerido">*</span></label>
                  <input
                    type="text"
                    value={nuevo.precio ? formatPriceCL(nuevo.precio) : ''}
                    onChange={e => setNuevo({ ...nuevo, precio: formatPriceCL(e.target.value) })}
                    placeholder="Ej: $12.500"
                    className="input-moderno"
                  />
                </div>

                <div className="campo-moderno">
                  <label>Ganancia (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={nuevo.gananciaPct}
                    onChange={e => setNuevo({ ...nuevo, gananciaPct: e.target.value })}
                    placeholder="%"
                    className="input-moderno"
                  />
                </div>

                {/* Campo de stock ocultado por requerimiento; el stock se inicializa en 0 al crear */}

                <div className="campo-moderno">
                  <label>Imagen (archivo local)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                      setNuevo({ ...nuevo, imagenFile: file });
                      if (imagenPreviewUrl) {
                        try { URL.revokeObjectURL(imagenPreviewUrl); } catch {}
                      }
                      setImagenPreviewUrl(file ? URL.createObjectURL(file) : null);
                    }}
                    className="input-moderno"
                  />
                </div>

                <div className="campo-moderno">
                  <label>Imagen seleccionada</label>
                  <input
                    type="text"
                    value={nuevo.imagenFile ? nuevo.imagenFile.name : ''}
                    readOnly
                    placeholder="No hay archivo seleccionado"
                    className="input-moderno"
                  />
                </div>
                
                {imagenPreviewUrl && (
                  <div className="campo-moderno">
                    <label>Vista previa</label>
                    <div className="imagen-actual-preview">
                      <img src={imagenPreviewUrl} alt="Vista previa" className="imagen-thumbnail" />
                    </div>
                  </div>
                )}

                {editando && nuevo.imagenUrl && (
                  <div className="campo-moderno">
                    <label>Imagen actual</label>
                    <div className="imagen-actual-preview">
                      <img src={buildImageSrc(nuevo.imagenUrl)} alt="Imagen actual" className="imagen-thumbnail" />
                    </div>
                  </div>
                )}

                
              </div>
              {editando && (
                <div className="campo-moderno">
                  <label>Estado</label>
                  <select
                    value={nuevo.activo}
                    onChange={e => setNuevo({ ...nuevo, activo: e.target.value === 'true' })}
                    className="input-moderno"
                  >
                    <option value={true}>Activo</option>
                    <option value={false}>Inactivo</option>
                  </select>
                </div>
              )}
              
            <div className="dialog-actions-centrado">
              <button 
              onClick={handleAgregar} 
              className="btn btn-confirmar"
              disabled={loading}
            >
              {loading ? 'Procesando...' : (editando ? "Actualizar Producto" : "Agregar Producto")}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    <div className="productos-layout">
      <div className="tabla-productos-section">
        <div className="tabla-wrapper">
          <table className="tabla-productos">
            <thead>
              <tr>
                <th>ID</th>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th className="columna-precio">Precio</th>
                <th className="columna-ganancia">Ganancia (%)</th>
                <th className="columna-stock">Stock</th>
                <th>Medida</th>
                <th>Marca</th>
                <th>Color</th>
                <th className="columna-estado">Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="12" className="sin-resultados">Cargando productos...</td>
                </tr>
              ) : productosActuales.length > 0 ? (
                productosActuales.map(p => (
                  <tr key={p.id} className={!p.activo ? 'fila-anulada' : ''}>
                    <td className="columna-id">{p.id}</td>
                    <td className="columna-imagen">
                      <div className="imagen-container">
                        {getProductoImagenUrl(p) ? (
                          <>
                            <img 
                              src={buildImageSrc(getProductoImagenUrl(p))} 
                              alt={p.nombre}
                              className="imagen-thumbnail"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="imagen-placeholder" style={{display: 'none'}}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="#9ca3af"/>
                              </svg>
                            </div>
                            </>
                          ) : (
                            <div className="imagen-placeholder">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="#9ca3af"/>
                              </svg>
                              <span className="sin-imagen">Sin imagen</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="columna-nombre">{p.nombre}</td>
                      <td className="columna-categoria">{p.categoria?.nombre || 'Sin categoría'}</td>
                      <td className="columna-descripcion" title={p.descripcion || ''}>
                        <div className="descripcion-texto">
                          {p.descripcion && p.descripcion.trim() ? p.descripcion : 'Sin descripción'}
                        </div>
                      </td>
                      <td className="columna-precio">${Number(p.precio).toLocaleString()}</td>
                      <td className="columna-ganancia" title={(productGanancias[p.id] ?? p.porcentajeGanancia ?? '') ? `${productGanancias[p.id] ?? p.porcentajeGanancia}%` : ''}>
                        {(() => {
                          const val = parseFloat(String(productGanancias[p.id] ?? p.porcentajeGanancia ?? '').trim());
                          return Number.isFinite(val) ? `${val}%` : '—';
                        })()}
                      </td>
                      <td className="columna-stock">{p.stock}</td>
                      <td className="columna-medida">{p.medida?.nombre || 'Sin medida'}</td>
                      <td className="columna-marca">{p.marca?.nombre || 'Sin marca'}</td>
                      <td className="columna-color">
                        {(() => {
                          const desc = String(p.descripcion || '');
                          const m = desc.match(/Color:\s*([^•\(]+)\s*\(([^\)]+)\)/i);
                          if (m) {
                            const nombreColor = m[1].trim();
                            const codigo = m[2].trim();
                            return (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 18, height: 18, borderRadius: 4, border: '1px solid #e5e7eb', background: codigo }} />
                                <span style={{ fontSize: 12, color: '#374151' }}>{nombreColor}</span>
                              </span>
                            );
                          }
                          return '—';
                        })()}
                      </td>
                      <td className="columna-estado">
                        <button
                          type="button"
                          className={`estado ${p.activo ? 'activo' : 'inactivo'}`}
                          onClick={() => toggleEstado(p.id)}
                          title={p.activo ? 'Desactivar' : 'Activar'}
                          disabled={loading}
                        >
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="acciones">
                        <button onClick={() => {
                          setDetalleProducto(p);
                          setVerDetalleOpen(true);
                        }} className="btn-icono btn-detalles" title="Ver Detalles" disabled={loading}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#6b7280"/>
                          </svg>
                        </button>
                        <button onClick={() => editarProducto(p)} className="btn-icono btn-editar" title="Editar" disabled={loading || !p.activo}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#000000"/>
                          </svg>
                        </button>
                        <button onClick={() => eliminarProducto(p.id)} className="btn-icono btn-eliminar" title="Eliminar" disabled={loading || !p.activo}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#dc2626"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" className="sin-resultados">No hay productos registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Paginación */}
      <Pagination
        currentPage={paginaActual}
        totalPages={totalPaginas}
        onPageChange={cambiarPagina}
        itemsPerPage={productosPorPagina}
        totalItems={productosFiltrados.length}
        showInfo={true}
      />

      {/* Footer de sección eliminado según solicitud */}

      {/* Modal Detalles */}
      <Dialog.Root
        open={verDetalleOpen}
        onOpenChange={(open) => {
          if (!open) {
            setVerDetalleOpen(false);
            setDetalleProducto(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content dialog-detalles">
            <Dialog.Close asChild>
              <button className="dialog-close-unified" aria-label="Cerrar">&times;</button>
            </Dialog.Close>
            
            <Dialog.Title className="modal-titulo-base">
              Detalles del Producto
            </Dialog.Title>

            {detalleProducto && (
              <>
                <div className="seccion-detalles-base">
                  <h3 className="titulo-seccion-base">Información del Producto</h3>
                  <div className="formulario-dos-columnas-base">
                    <div className="detalle-grupo-base">
                      <label>Nombre:</label>
                      <span>{detalleProducto.nombre}</span>
                    </div>
                    <div className="detalle-grupo-base">
                      <label>Categoría:</label>
                      <span>{detalleProducto.categoria?.nombre || 'Sin categoría'}</span>
                    </div>
                    <div className="detalle-grupo-base">
                      <label>Descripción:</label>
                      <span>{detalleProducto.descripcion || 'Sin descripción'}</span>
                    </div>
                    <div className="detalle-grupo-base">
                      <label>Precio:</label>
                      <span>${Number(detalleProducto.precio).toLocaleString()}</span>
                    </div>
                    <div className="detalle-grupo-base">
                      <label>Stock:</label>
                      <span>{detalleProducto.stock}</span>
                    </div>
                    <div className="detalle-grupo-base">
                      <label>Imagen:</label>
                      {getProductoImagenUrl(detalleProducto) ? (
                        <img src={buildImageSrc(getProductoImagenUrl(detalleProducto))} alt={detalleProducto.nombre} style={{ maxWidth: '160px', height: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                      ) : (
                        <span>Sin imagen</span>
                      )}
                    </div>
                    <div className="detalle-grupo-base">
                      <label>Estado:</label>
                      <span className={`estado-badge ${detalleProducto.activo ? 'activo' : 'inactivo'}`}>
                        {detalleProducto.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  {/* Sección de Proveedores */}
                  <div className="seccion-detalles-base">
                    <h3 className="titulo-seccion-base">Proveedores del Producto</h3>
                    {detalleProducto.productoProveedores && detalleProducto.productoProveedores.length > 0 ? (
                      <div className="proveedores-lista">
                        {detalleProducto.productoProveedores.map((pp, index) => (
                          <div key={`proveedor-${pp.proveedorId ?? pp.id ?? index}`} className="proveedor-item">
                            <div className="proveedor-info">
                              <div className="proveedor-nombre">
                                <strong>{pp.proveedor?.nombre || 'Proveedor sin nombre'}</strong>
                                {pp.esProveedorPrincipal && (
                                  <span className="badge-principal">Principal</span>
                                )}
                              </div>
                              <div className="proveedor-detalles">
                                <span>Precio: ${Number(pp.precioCompra).toLocaleString()}</span>
                                <span>Código: {pp.codigoProveedor || 'N/A'}</span>
                                <span>Entrega: {pp.tiempoEntregaDias} días</span>
                                <span>Mín: {pp.cantidadMinima}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="sin-proveedores">
                        <p>Este producto no tiene proveedores asignados.</p>
                      </div>
                    )}
                  </div>
                </div>
                </>
              )}
              

            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
};

export default ProductosTable;

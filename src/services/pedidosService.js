import { API_BASE_URL, API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '../constants/apiConstants';
import { getToken as getStoreToken } from '../features/auth/tokenStore';
import clientesService from './clientesService';
import ventasService from './ventasService';

class PedidosService {
  constructor() {
    this.baseURL = `${API_BASE_URL}${API_ENDPOINTS.PEDIDOS.GET_ALL}`;
  }

  async obtenerPedidos() {
    try {
      const response = await fetch(this.baseURL, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {}
    // Intentar endpoint de administración que lista pedidos de clientes
    try {
      const respAdminClientes = await fetch(buildApiUrl(API_ENDPOINTS.CLIENTES.PEDIDOS_ADMIN), {
        headers: DEFAULT_HEADERS,
        credentials: 'include'
      });
      if (respAdminClientes.ok) {
        const data = await respAdminClientes.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {}
    try {
      const mios = await clientesService.obtenerMisPedidos();
      return Array.isArray(mios) ? mios : [];
    } catch {
      try {
        const ventas = await ventasService.obtenerVentas();
        if (Array.isArray(ventas) && ventas.length > 0) {
          return ventas.map(v => ({
            id: v.id || v.Id,
            fechaCreacion: v.fechaVenta || v.fechaCreacion || v.FechaVenta,
            cliente: { nombre: v.cliente?.nombre || v.clienteNombre || v.ClienteNombre },
            items: (v.items || v.detalles || []).map(d => ({
              id: d.productoId || d.id,
              productoId: d.productoId || d.id,
              nombre: d.nombre || d.ProductoNombre,
              cantidad: d.cantidad || d.Cantidad,
              precioUnitario: d.precioUnitario || d.Precio
            })),
            total: v.total || v.Total || 0,
            estado: v.estado || v.Estado || 'Pagado',
            metodoPago: v.metodoPago || v.MetodoPago || '—',
          }));
        }
      } catch {}
      try {
        const raw = localStorage.getItem('pedidosLocal') || '[]';
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
  }

  async obtenerPedidoPorId(id) {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PEDIDOS.GET_BY_ID.replace(':id', id)}`, { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`Error al obtener pedido: ${response.status}`);
    }
    return await response.json();
  }

  async crearPedido(pedido) {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PEDIDOS.CREATE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(pedido)
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error al crear pedido: ${response.status} - ${errorData}`);
    }
    return await response.json();
  }

  async actualizarPedido(id, pedido) {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PEDIDOS.UPDATE.replace(':id', id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(pedido)
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error al actualizar pedido: ${response.status} - ${errorData}`);
    }
    return response.status === 204;
  }

  async eliminarPedido(id) {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PEDIDOS.DELETE.replace(':id', id)}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error(`Error al eliminar pedido: ${response.status}`);
    }
    return response.status === 204;
  }

  async cambiarEstadoPedido(id, estado) {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PEDIDOS.CAMBIAR_ESTADO.replace(':id', id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ estado })
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error al cambiar estado de pedido: ${response.status} - ${errorData}`);
    }
    return response.status === 204;
  }

  async confirmarPedido(id) {
    const token = getStoreToken();
    const headers = token ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` } : { ...DEFAULT_HEADERS };
    const url = buildApiUrl(API_ENDPOINTS.PEDIDOS.CONFIRMAR.replace(':id', id));
    const response = await fetch(url, { method: 'POST', headers, credentials: 'include' });
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(errorText || `Error ${response.status}`);
    }
    return await response.json();
  }

  async obtenerHistorialEstados(id) {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PEDIDOS.HISTORIAL_ESTADOS.replace(':id', id)}`, { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`Error al obtener historial de estados: ${response.status}`);
    }
    return await response.json();
  }

  async crearDesdeCarrito(carritoItems, datosCompra) {
    try {
      const token = getStoreToken();
      const headers = token ? { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` } : { ...DEFAULT_HEADERS };
      // Asegurar cliente usando endpoints de “mi cuenta”, sin requerir rol admin
      let me;
      try {
        me = await clientesService.obtenerMiCliente();
        // Actualizar datos básicos si el usuario envió información
        const payloadContacto = {
          Nombre: datosCompra?.Nombres || undefined,
          Apellido: datosCompra?.Apellidos || undefined,
          Documento: datosCompra?.Documento || undefined,
          Telefono: datosCompra?.Telefono || undefined,
          Direccion: datosCompra?.Direccion || undefined,
          Ciudad: datosCompra?.Ciudad || undefined,
          CodigoPostal: datosCompra?.CodigoPostal || undefined
        };
        const hasContacto = Object.values(payloadContacto).some(v => v != null && v !== '');
        if (hasContacto) {
          try { await clientesService.actualizarMiCliente(payloadContacto); } catch {}
        }
      } catch (e) {
        throw new Error(e?.message || 'No se pudo identificar tu cuenta de cliente');
      }
      const detalles = (carritoItems || []).map(it => {
        const cantidad = Number(it.cantidad || 0);
        const precioUnitario = Number(it.precioNumerico || 0);
        return {
          ProductoId: Number(it.id),
          Cantidad: cantidad,
          PrecioUnitario: precioUnitario,
          Descuento: 0,
          Subtotal: cantidad * precioUnitario
        };
      });
      const subtotal = detalles.reduce((acc, d) => acc + Number(d.Subtotal || 0), 0);
      const impuestos = 0;
      const costoEnvio = 0;
      const total = subtotal + impuestos + costoEnvio;
      const pedidoDto = {
        ClienteId: Number(me?.id || me?.Id || 0),
        Estado: 'Pendiente',
        Subtotal: subtotal,
        CostoEnvio: costoEnvio,
        Impuestos: impuestos,
        Total: total,
        DireccionEntrega: datosCompra?.Direccion || null,
        CiudadEntrega: datosCompra?.Ciudad || null,
        CodigoPostalEntrega: datosCompra?.CodigoPostal || null,
        TelefonoContacto: datosCompra?.Telefono || null,
        Observaciones: datosCompra?.Observaciones || null,
        DetallesPedido: detalles
      };
      // Crear pedido directamente en “mi cuenta” para evitar 403 por roles
      const respMe = await fetch(buildApiUrl(API_ENDPOINTS.CLIENTES.ME_PEDIDOS), {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(pedidoDto)
      });
      if (!respMe.ok) {
        const errTxtMe = await respMe.text().catch(() => '');
        // Si el usuario tiene rol de administración, intentar endpoint general
        const respAdmin = await fetch(buildApiUrl(API_ENDPOINTS.PEDIDOS.CREATE), {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(pedidoDto)
        });
        if (!respAdmin.ok) {
          const errTxtAdmin = await respAdmin.text().catch(() => '');
          throw new Error(errTxtMe || errTxtAdmin || `Error ${respMe.status}`);
        }
        var creado = await respAdmin.json();
      } else {
        var creado = await respMe.json();
      }
      try {
        const raw = localStorage.getItem('pedidosLocal') || '[]';
        const list = JSON.parse(raw);
        const nuevo = {
          id: creado?.id || creado?.Id || Date.now(),
          fechaCreacion: creado?.fechaPedido || creado?.fechaCreacion || new Date().toISOString(),
          cliente: creado?.cliente || null,
          items: (creado?.detallesPedido || []).map(d => ({
            productoId: d.productoId,
            nombre: d.producto?.nombre || '',
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario
          })),
          total: creado?.total || total,
          estado: creado?.estado || 'Pendiente',
          metodoPago: datosCompra?.MetodoPago || 'Efectivo',
          metodoTransferencia: datosCompra?.MetodoTransferencia || null
        };
        const nuevaLista = Array.isArray(list) ? [nuevo, ...list] : [nuevo];
        localStorage.setItem('pedidosLocal', JSON.stringify(nuevaLista));
      } catch {}
      return creado;
    } catch (error) {
      console.error('Error al crear pedido desde carrito:', error);
      throw error;
    }
  }
}

const pedidosService = new PedidosService();
export default pedidosService;

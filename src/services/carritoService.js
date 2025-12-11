import { API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '../constants/apiConstants';

// Utilidad para parsear JSON de forma segura (maneja respuestas vacías o no-JSON)
const parseJsonSafe = async (response) => {
  const rawText = await response.text();
  let data = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch (e) {
    data = {};
  }
  return { data, rawText };
};

class CarritoService {
  // Obtener carrito del usuario autenticado
  async obtenerCarrito(token) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CARRITO.GET), {
        method: 'GET',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        }
      });
      const { data, rawText } = await parseJsonSafe(response);
      if (response.ok) {
        return data;
      }
      throw new Error(data.Message || data.message || rawText || 'Error al obtener el carrito');
    } catch (error) {
      console.error('Error en obtenerCarrito:', error);
      throw error;
    }
  }

  // Agregar item al carrito
  async agregarItem(token, productoId, cantidad = 1) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CARRITO.AGREGAR_ITEM), {
        method: 'POST',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ProductoId: productoId,
          Cantidad: cantidad
        })
      });
      const { data, rawText } = await parseJsonSafe(response);
      if (response.ok) {
        return data;
      }
      throw new Error(data.Message || data.message || rawText || 'Error al agregar item al carrito');
    } catch (error) {
      console.error('Error en agregarItem:', error);
      throw error;
    }
  }

  // Actualizar cantidad de un item
  async actualizarItem(token, itemId, cantidad) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CARRITO.ACTUALIZAR_ITEM.replace(':itemId', itemId)), {
        method: 'PUT',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ Cantidad: cantidad })
      });
      const { data, rawText } = await parseJsonSafe(response);
      if (response.ok) {
        return data;
      }
      throw new Error(data.Message || data.message || rawText || 'Error al actualizar item del carrito');
    } catch (error) {
      console.error('Error en actualizarItem:', error);
      throw error;
    }
  }

  // Eliminar item del carrito
  async eliminarItem(token, itemId) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CARRITO.ELIMINAR_ITEM.replace(':itemId', itemId)), {
        method: 'DELETE',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        }
      });
      const { data, rawText } = await parseJsonSafe(response);
      if (response.ok) {
        return data;
      }
      throw new Error(data.message || rawText || 'Error al eliminar item del carrito');
    } catch (error) {
      console.error('Error en eliminarItem:', error);
      throw error;
    }
  }

  // Vaciar carrito
  async vaciarCarrito(token) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CARRITO.VACIAR), {
        method: 'DELETE',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        }
      });
      const { data, rawText } = await parseJsonSafe(response);
      // Tratar 404 (carrito no encontrado) como estado aceptable para continuar
      if (response.ok || response.status === 404) {
        return data;
      }
      throw new Error(data.Message || data.message || rawText || 'Error al vaciar carrito');
    } catch (error) {
      console.error('Error en vaciarCarrito:', error);
      throw error;
    }
  }

  // Procesar compra
  async procesarCompra(token, datosCompra) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CARRITO.PROCESAR_COMPRA), {
        method: 'POST',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          Nombres: datosCompra.Nombres || null,
          Apellidos: datosCompra.Apellidos || null,
          Telefono: datosCompra.Telefono || null,
          Direccion: datosCompra.Direccion || null,
          Ciudad: datosCompra.Ciudad || null,
          CodigoPostal: datosCompra.CodigoPostal || null,
          Documento: datosCompra.Documento || null,
          TipoDocumentoId: datosCompra.TipoDocumentoId || null,
          MetodoPago: datosCompra.MetodoPago || 'Efectivo',
          MetodoTransferencia: datosCompra.MetodoTransferencia || null,
          Observaciones: datosCompra.Observaciones || null
        })
      });
      const { data, rawText } = await parseJsonSafe(response);
      if (response.ok) {
        return data;
      }
        // el backend de compra usa PascalCase en Message
      throw new Error(data.Message || data.message || rawText || 'Error al procesar la compra');
    } catch (error) {
      console.error('Error en procesarCompra:', error);
      throw error;
    }
  }

  // Formatear items del carrito para uso local
  formatearItemsCarrito(carritoBackend) {
    if (!carritoBackend || !carritoBackend.items) {
      return [];
    }

    return carritoBackend.items.map(item => ({
      id: item.productoId,
      nombre: item.productoNombre || 'Producto',
      precioNumerico: item.precioUnitario,
      cantidad: item.cantidad,
      imagen: item.productoImagen,
      stock: item.producto?.stock || 0
    }));
  }
}

const carritoService = new CarritoService();
export default carritoService;

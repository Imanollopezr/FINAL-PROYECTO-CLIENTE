import { API_BASE_URL, API_ENDPOINTS } from '../constants/apiConstants';

class VentasService {
    constructor() {
        this.baseURL = `${API_BASE_URL}${API_ENDPOINTS.VENTAS.GET_ALL}`;
    }

  async obtenerVentas() {
    try {
      const response = await fetch(this.baseURL, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Error al obtener ventas: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error al obtener ventas:', error);
      throw error;
    }
  }

    async obtenerVentaPorId(id) {
        try {
            const response = await fetch(`${this.baseURL}/${id}`);
            if (!response.ok) {
                throw new Error(`Error al obtener venta: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener venta:', error);
            throw error;
        }
    }

    async crearVenta(venta) {
        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(venta)
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Error al crear venta: ${response.status} - ${errorData}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error al crear venta:', error);
            throw error;
        }
    }

    async actualizarVenta(id, venta) {
        try {
            const response = await fetch(`${this.baseURL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(venta)
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Error al actualizar venta: ${response.status} - ${errorData}`);
            }
            
            return response.status === 204;
        } catch (error) {
            console.error('Error al actualizar venta:', error);
            throw error;
        }
    }

    async eliminarVenta(id) {
        try {
            const response = await fetch(`${this.baseURL}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`Error al eliminar venta: ${response.status}`);
            }
            
            return response.status === 204;
        } catch (error) {
            console.error('Error al eliminar venta:', error);
            throw error;
        }
    }

    // Nueva función específica para anular ventas con recuperación de stock
    async anularVenta(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ventas/${id}/anular`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Error al anular venta: ${response.status} - ${errorData}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error al anular venta:', error);
            throw error;
        }
    }

    async obtenerVentasPorCliente(clienteId) {
        try {
            const response = await fetch(`${this.baseURL}/cliente/${clienteId}`);
            if (!response.ok) {
                throw new Error(`Error al obtener ventas por cliente: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener ventas por cliente:', error);
            throw error;
        }
    }

    async obtenerVentasPorFecha(fecha) {
        try {
            const fechaFormateada = fecha.toISOString().split('T')[0];
            const response = await fetch(`${this.baseURL}/fecha/${fechaFormateada}`);
            if (!response.ok) {
                throw new Error(`Error al obtener ventas por fecha: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener ventas por fecha:', error);
            throw error;
        }
    }

    async cambiarEstadoVenta(id, nuevoEstado) {
        try {
            const response = await fetch(`${this.baseURL}/${id}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(nuevoEstado)
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Error al cambiar estado de venta: ${response.status} - ${errorData}`);
            }
            
            return response.status === 204;
        } catch (error) {
            console.error('Error al cambiar estado de venta:', error);
            throw error;
        }
    }

    async obtenerReporteVentas(fechaInicio, fechaFin) {
        try {
            const params = new URLSearchParams({
                fechaInicio: fechaInicio.toISOString().split('T')[0],
                fechaFin: fechaFin.toISOString().split('T')[0]
            });
            
            const response = await fetch(`${this.baseURL}/reporte?${params}`);
            if (!response.ok) {
                throw new Error(`Error al obtener reporte de ventas: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener reporte de ventas:', error);
            throw error;
        }
    }
}

// Exportar una instancia del servicio
const ventasService = new VentasService();
export default ventasService;

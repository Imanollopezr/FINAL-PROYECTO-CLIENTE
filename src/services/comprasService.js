import { API_BASE_URL, API_ENDPOINTS } from '../constants/apiConstants';

class ComprasService {
    async obtenerCompras() {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COMPRAS.GET_ALL}`);
            if (!response.ok) {
                throw new Error(`Error al obtener compras: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener compras:', error);
            throw error;
        }
    }

    async obtenerCompraPorId(id) {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COMPRAS.GET_BY_ID.replace(':id', id)}`);
            if (!response.ok) {
                throw new Error(`Error al obtener compra: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener compra:', error);
            throw error;
        }
    }

    async crearCompra(compra) {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COMPRAS.CREATE}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(compra)
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Error al crear compra: ${response.status} - ${errorData}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error al crear compra:', error);
            throw error;
        }
    }

    async actualizarCompra(id, compra) {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COMPRAS.UPDATE.replace(':id', id)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(compra)
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Error al actualizar compra: ${response.status} - ${errorData}`);
            }
            
            return response.status === 204;
        } catch (error) {
            console.error('Error al actualizar compra:', error);
            throw error;
        }
    }

    async eliminarCompra(id) {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COMPRAS.DELETE.replace(':id', id)}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`Error al eliminar compra: ${response.status}`);
            }
            
            return response.status === 204;
        } catch (error) {
            console.error('Error al eliminar compra:', error);
            throw error;
        }
    }

    async obtenerComprasPorProveedor(proveedorId) {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COMPRAS.POR_PROVEEDOR.replace(':proveedorId', proveedorId)}`);
            if (!response.ok) {
                throw new Error(`Error al obtener compras por proveedor: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener compras por proveedor:', error);
            throw error;
        }
    }

    async obtenerComprasPorFecha(fecha) {
        try {
            const fechaFormateada = fecha.toISOString().split('T')[0];
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COMPRAS.POR_FECHA.replace(':fecha', fechaFormateada)}`);
            if (!response.ok) {
                throw new Error(`Error al obtener compras por fecha: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener compras por fecha:', error);
            throw error;
        }
    }

    async obtenerReporteCompras(fechaInicio, fechaFin) {
        try {
            // Como no existe endpoint específico de reporte, obtenemos todas las compras y filtramos
            const compras = await this.obtenerCompras();
            
            if (fechaInicio && fechaFin) {
                const inicio = new Date(fechaInicio);
                const fin = new Date(fechaFin);
                
                return compras.filter(compra => {
                    const fechaCompra = new Date(compra.fechaCompra);
                    return fechaCompra >= inicio && fechaCompra <= fin;
                });
            }
            
            return compras;
        } catch (error) {
            console.error('Error al obtener reporte de compras:', error);
            throw error;
        }
    }

    async buscarCompras(termino) {
        try {
            // Como no existe endpoint de búsqueda, filtraremos localmente
            const compras = await this.obtenerCompras();
            return compras.filter(compra => 
                compra.numeroFactura?.toLowerCase().includes(termino.toLowerCase()) ||
                compra.proveedor?.nombre?.toLowerCase().includes(termino.toLowerCase()) ||
                compra.estado?.toLowerCase().includes(termino.toLowerCase()) ||
                compra.observaciones?.toLowerCase().includes(termino.toLowerCase())
            );
        } catch (error) {
            console.error('Error al buscar compras:', error);
            throw error;
        }
    }

    async confirmarRecepcion(id) {
        try {
            // Como no existe endpoint específico, usaremos el update para cambiar el estado
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COMPRAS.UPDATE.replace(':id', id)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    estado: 'Recibida',
                    fechaRecepcion: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error al confirmar recepción:', error);
            throw error;
        }
    }
}

// Exportar una instancia del servicio
const comprasService = new ComprasService();
export default comprasService;
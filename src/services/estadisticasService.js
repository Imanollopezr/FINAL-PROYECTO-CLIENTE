import { API_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '../constants/apiConstants';

// Headers con autorización (token almacenado en localStorage)
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    ...DEFAULT_HEADERS,
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

class EstadisticasService {
  constructor() {}

  // Fetch con manejo de autorización y auto-refresh de token
  async authFetch(endpoint, options = {}) {
    const url = buildApiUrl(endpoint);
    const buildOptions = () => ({
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {})
      }
    });

    let response = await fetch(url, buildOptions());

    if (response.status === 401) {
      try {
        const currentToken = localStorage.getItem('authToken');
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
          const refreshResponse = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.REFRESH_TOKEN), {
            method: 'POST',
            headers: DEFAULT_HEADERS,
            body: JSON.stringify({ Token: currentToken, RefreshToken: refreshToken })
          });

          const refreshData = await refreshResponse.json().catch(() => ({}));
          if (refreshResponse.ok && refreshData && refreshData.data && refreshData.data.token) {
            localStorage.setItem('authToken', refreshData.data.token);
            if (refreshData.data.refreshToken) {
              localStorage.setItem('refreshToken', refreshData.data.refreshToken);
            }
            response = await fetch(url, buildOptions());
          } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
          }
        }
      } catch (err) {
        console.error('Error al refrescar token (estadísticas):', err);
      }
    }

    return response;
  }

  // Helper: fetch con timeout y parseo JSON
  async fetchJson(endpoint, options = {}, timeoutMs = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await this.authFetch(endpoint, { ...options, signal: controller.signal });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(`HTTP ${resp.status}: ${txt || resp.statusText}`);
      }
      return await resp.json();
    } finally {
      clearTimeout(id);
    }
  }

  // Obtener estadísticas de ventas desde el endpoint específico
  async obtenerEstadisticasVentas() {
    try {
      return await this.fetchJson('/api/Ventas/estadisticas');
    } catch (error) {
      console.error('Error al obtener estadísticas de ventas:', error);
      // Fallback seguro para no romper el dashboard
      return {
        VentasHoy: 0,
        VentasMes: 0,
        TotalVentasHoy: 0,
        TotalVentasMes: 0,
        ProductosMasVendidos: []
      };
    }
  }

  // Obtener total de productos (activos/inactivos)
  async obtenerTotalProductos() {
    try {
      const productos = await this.fetchJson(API_ENDPOINTS.PRODUCTOS.GET_ALL);
      const activos = (productos || []).filter(p => p.activo).length;
      const inactivos = (productos || []).filter(p => !p.activo).length;
      return { total: (productos || []).length, activos, inactivos };
    } catch (error) {
      console.error('Error al obtener productos:', error);
      // Fallback
      return { total: 0, activos: 0, inactivos: 0 };
    }
  }

  // Obtener total de clientes (activos/inactivos si existe campo)
  async obtenerTotalClientes() {
    try {
      const clientes = await this.fetchJson(API_ENDPOINTS.CLIENTES.GET_ALL + '?includeInactive=true');
      const activos = (clientes || []).filter(c => c.activo ?? true).length;
      const inactivos = (clientes || []).filter(c => !(c.activo ?? true)).length;
      return { total: (clientes || []).length, activos, inactivos };
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      // Fallback
      return { total: 0, activos: 0, inactivos: 0 };
    }
  }

  // Obtener estadísticas de compras
  async obtenerEstadisticasCompras() {
    try {
      const compras = await this.fetchJson(API_ENDPOINTS.COMPRAS.GET_ALL);
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      const comprasHoy = compras.filter(c => {
        const fechaCompra = new Date(c.fechaCompra);
        return fechaCompra.toDateString() === hoy.toDateString();
      });

      const comprasMes = compras.filter(c => {
        const fechaCompra = new Date(c.fechaCompra);
        return fechaCompra >= inicioMes;
      });

      return {
        totalCompras: compras.length,
        comprasHoy: comprasHoy.length,
        comprasMes: comprasMes.length,
        totalGastadoMes: comprasMes.reduce((sum, c) => sum + (c.total || 0), 0)
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de compras:', error);
      // Fallback
      return { totalCompras: 0, comprasHoy: 0, comprasMes: 0, totalGastadoMes: 0 };
    }
  }

  // Obtener todas las estadísticas del dashboard (tolerante a fallos)
  async obtenerEstadisticasDashboard() {
    try {
      const resultados = await Promise.allSettled([
        this.obtenerEstadisticasVentas(),
        this.obtenerTotalProductos(),
        this.obtenerTotalClientes(),
        this.obtenerEstadisticasCompras()
      ]);

      const ventas = resultados[0].status === 'fulfilled' ? resultados[0].value : { VentasHoy: 0, VentasMes: 0, TotalVentasHoy: 0, TotalVentasMes: 0, ProductosMasVendidos: [] };
      const productos = resultados[1].status === 'fulfilled' ? resultados[1].value : { total: 0, activos: 0, inactivos: 0 };
      const clientes = resultados[2].status === 'fulfilled' ? resultados[2].value : { total: 0, activos: 0, inactivos: 0 };
      const compras = resultados[3].status === 'fulfilled' ? resultados[3].value : { totalCompras: 0, comprasHoy: 0, comprasMes: 0, totalGastadoMes: 0 };

      return {
        ventas,
        productos,
        clientes,
        compras,
        fechaActualizacion: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error al obtener estadísticas del dashboard:', error);
      // Nunca lanzar para que el Dashboard no quede bloqueado
      return {
        ventas: { VentasHoy: 0, VentasMes: 0, TotalVentasHoy: 0, TotalVentasMes: 0, ProductosMasVendidos: [] },
        productos: { total: 0, activos: 0, inactivos: 0 },
        clientes: { total: 0, activos: 0, inactivos: 0 },
        compras: { totalCompras: 0, comprasHoy: 0, comprasMes: 0, totalGastadoMes: 0 },
        fechaActualizacion: new Date().toISOString()
      };
    }
  }

  async obtenerSerieVentas(fromDate, toDate, groupBy = 'month') {
    try {
      const params = new URLSearchParams({
        from: new Date(fromDate).toISOString(),
        to: new Date(toDate).toISOString(),
        groupBy
      });
      return await this.fetchJson(`/api/Ventas/estadisticas/serie?${params.toString()}`);
    } catch (error) {
      console.error('Error al obtener serie de ventas:', error);
      // Fallback: serie vacía
      return [];
    }
  }

  async obtenerTopProductos(fromDate, toDate, limit = 5) {
    try {
      const params = new URLSearchParams({
        from: new Date(fromDate).toISOString(),
        to: new Date(toDate).toISOString(),
        limit: String(limit)
      });
      return await this.fetchJson(`/api/Ventas/estadisticas/top-productos?${params.toString()}`);
    } catch (error) {
      console.error('Error al obtener top de productos:', error);
      // Fallback: lista vacía
      return [];
    }
  }

  // Calcular promedios mensuales a partir de la serie de ventas agrupada por mes
  calcularPromediosMensualesDesdeSerie(serie = []) {
    try {
      const meses = (serie || []).filter(s => Number.isFinite(s?.TotalMonto) || Number.isFinite(s?.TotalVentas));
      const n = meses.length || 1;
      const sumaMonto = meses.reduce((acc, s) => acc + (Number(s?.TotalMonto) || 0), 0);
      const sumaPedidos = meses.reduce((acc, s) => acc + (Number(s?.TotalVentas) || 0), 0);
      return {
        avgMontoMensual: sumaMonto / n,
        avgPedidosMensuales: sumaPedidos / n
      };
    } catch (error) {
      console.error('Error al calcular promedios mensuales:', error);
      return { avgMontoMensual: 0, avgPedidosMensuales: 0 };
    }
  }

  // Obtener top clientes recurrentes del mes (intenta endpoint; fallback calcula desde ventas)
  async obtenerTopClientesMes(fromDate, toDate, limit = 5) {
    const fromIso = new Date(fromDate).toISOString();
    const toIso = new Date(toDate).toISOString();
    try {
      const params = new URLSearchParams({ from: fromIso, to: toIso, limit: String(limit) });
      const data = await this.fetchJson(`/api/Ventas/estadisticas/top-clientes?${params.toString()}`);
      if (Array.isArray(data)) return data; // Formato esperado del backend
    } catch (error) {
      console.warn('Endpoint top-clientes no disponible, usando cálculo local:', error?.message || error);
    }

    // Fallback: cálculo local desde todas las ventas
    try {
      const ventas = await this.fetchJson(API_ENDPOINTS.VENTAS.GET_ALL);
      const inicio = new Date(fromDate);
      const fin = new Date(toDate);
      const esDelMes = v => {
        const f = new Date(v.fecha || v.Fecha || v.fechaVenta || v.createdAt || v.FechaVenta);
        return f >= inicio && f <= fin;
      };
      const porCliente = new Map();
      (ventas || []).filter(esDelMes).forEach(v => {
        const rawCliente = v.cliente ?? v.Cliente ?? v.clienteNombre ?? null;
        const nombre = (() => {
          if (rawCliente && typeof rawCliente === 'object') {
            const n = rawCliente.Nombre ?? rawCliente.nombre ?? null;
            const a = rawCliente.Apellido ?? rawCliente.apellido ?? null;
            if (n || a) return [n, a].filter(Boolean).join(' ').trim();
            return rawCliente.Email ?? rawCliente.email ?? rawCliente.Documento ?? rawCliente.documento ?? 'Cliente';
          }
          return (rawCliente ?? 'Cliente');
        })();
        const monto = Number(v.total ?? v.Total ?? v.monto ?? 0) || 0;
        const key = nombre || 'Cliente';
        const cur = porCliente.get(key) || { Cliente: key, Compras: 0, MontoTotal: 0 };
        cur.Compras += 1;
        cur.MontoTotal += monto;
        porCliente.set(key, cur);
      });
      const lista = Array.from(porCliente.values())
        .sort((a, b) => b.MontoTotal - a.MontoTotal || b.Compras - a.Compras)
        .slice(0, limit);
      return lista;
    } catch (error) {
      console.error('Error al calcular top clientes del mes:', error);
      return [];
    }
  }

  // Promedio de unidades vendidas entre los productos TOP en un rango de fechas
  async obtenerPromedioTopProductosMes(fromDate, toDate, limit = 5) {
    try {
      const top = await this.obtenerTopProductos(fromDate, toDate, limit);
      if (!Array.isArray(top) || top.length === 0) return { promedio: 0, items: [] };
      const total = top.reduce((acc, p) => acc + (Number(p.CantidadVendida) || 0), 0);
      return { promedio: total / top.length, items: top };
    } catch (error) {
      console.error('Error al obtener promedio del top de productos:', error);
      return { promedio: 0, items: [] };
    }
  }
}

const estadisticasService = new EstadisticasService();
export default estadisticasService;

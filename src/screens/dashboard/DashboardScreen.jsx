import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { FaDollarSign, FaShoppingCart, FaUsers, FaBox } from 'react-icons/fa';
import estadisticasService from '../../services/estadisticasService';
import { formatPriceCL } from '../../Utils/priceUtils';
import './DashboardScreen.scss';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DashboardScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [serie, setSerie] = useState([]);
  const [rangePreset, setRangePreset] = useState('6m');
  const [groupBy, setGroupBy] = useState('month');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [serieLoading, setSerieLoading] = useState(false);
  const [topProductos, setTopProductos] = useState([]);
  const [monthlyAvgRevenue, setMonthlyAvgRevenue] = useState(0);
  const [monthlyAvgOrders, setMonthlyAvgOrders] = useState(0);
  const [topClientesMes, setTopClientesMes] = useState([]);
  const [avgTopProductosMes, setAvgTopProductosMes] = useState(0);

  const loadSerie = async (from, to, groupByParam) => {
    try {
      setSerieLoading(true);
      const serieData = await estadisticasService.obtenerSerieVentas(from, to, groupByParam);
      setSerie(serieData);
      const { avgMontoMensual, avgPedidosMensuales } = estadisticasService.calcularPromediosMensualesDesdeSerie(serieData);
      setMonthlyAvgRevenue(avgMontoMensual);
      setMonthlyAvgOrders(avgPedidosMensuales);
    } catch (e) {
      console.error(e);
      // No bloquear el dashboard: usar serie vacía
      setSerie([]);
      setMonthlyAvgRevenue(0);
      setMonthlyAvgOrders(0);
    } finally {
      setSerieLoading(false);
    }
  };

  const loadTop = async (from, to) => {
    try {
      const data = await estadisticasService.obtenerTopProductos(from, to, 5);
      setTopProductos(data || []);
    } catch (e) {
      console.error(e);
      // Fallback seguro
      setTopProductos([]);
    }
  };

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const datos = await estadisticasService.obtenerEstadisticasDashboard();
        setStats(datos);
        const hoy = new Date();
        const from = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);
        const to = hoy;
        setFromDate(from);
        setToDate(to);
        setRangePreset('6m');
        setGroupBy('month');
        await loadSerie(from, to, 'month');
        await loadTop(from, to);

        // Calcular métricas del mes actual según estándares
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);
        const topClientes = await estadisticasService.obtenerTopClientesMes(inicioMes, finMes, 5);
        setTopClientesMes(topClientes || []);
        const { promedio } = await estadisticasService.obtenerPromedioTopProductosMes(inicioMes, finMes, 5);
        setAvgTopProductosMes(promedio || 0);
        setError('');
      } catch (e) {
        console.error(e);
        // No mostrar pantalla de error completa; continuar con valores por defecto
        setStats({
          ventas: { VentasHoy: 0, VentasMes: 0, TotalVentasHoy: 0, TotalVentasMes: 0, ProductosMasVendidos: [] },
          productos: { total: 0, activos: 0, inactivos: 0 },
          clientes: { total: 0, activos: 0, inactivos: 0 },
          compras: { totalCompras: 0, comprasHoy: 0, comprasMes: 0, totalGastadoMes: 0 },
          fechaActualizacion: new Date().toISOString()
        });
        setError('');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  // En lugar de bloquear por error, renderizamos con los datos disponibles
  const ingresosRango = (serie || []).reduce((sum, s) => sum + (s.TotalMonto ?? 0), 0);
  const ventasRango = (serie || []).reduce((sum, s) => sum + (s.TotalVentas ?? 0), 0);
  const clientesActivos = stats?.clientes?.activos ?? 0;
  const productosActivos = stats?.productos?.activos ?? 0;
  const productosInactivos = (stats?.productos?.inactivos ?? 0);
  const comprasMes = stats?.compras?.comprasMes ?? 0;
  const gastadoMes = stats?.compras?.totalGastadoMes ?? 0;

  const barTopVendidos = {
    labels: (topProductos || []).map(p => p.Nombre),
    datasets: [
      {
        label: 'Cantidad vendida',
        data: (topProductos || []).map(p => p.CantidadVendida),
        backgroundColor: ['#34d399','#60a5fa','#a78bfa','#fbbf24','#f87171'],
        borderRadius: 8,
      }
    ]
  };

  const lineSerieVentas = {
    labels: (serie || []).map(s => s.Label),
    datasets: [
      {
        label: 'Ingresos',
        data: (serie || []).map(s => s.TotalMonto ?? 0),
        borderColor: '#34d399',
        backgroundColor: 'rgba(52,211,153,0.2)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  const donutProductos = {
    labels: ['Activos', 'Inactivos'],
    datasets: [
      {
        data: [productosActivos, productosInactivos],
        backgroundColor: ['#60a5fa','#f87171'],
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.05)' } } }
  };

  return (
    <div className="simple-dashboard">
      <div className="dashboard-header">
        <h1>Panel de control</h1>
        <p>Datos reales del sistema, actualizados al {new Date(stats?.fechaActualizacion || Date.now()).toLocaleString()}</p>
        {error && <div className="inline-error">Hubo problemas al cargar algunos datos.</div>}
      </div>

      <div className="filters-bar">
        <div className="presets">
          <button
            className={rangePreset === '30d' ? 'active' : ''}
            onClick={async () => {
              const hoy = new Date();
              const from = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 29);
              setFromDate(from);
              setToDate(hoy);
              setRangePreset('30d');
              setGroupBy('day');
              await loadSerie(from, hoy, 'day');
              await loadTop(from, hoy);
            }}
          >
            Últimos 30 días
          </button>
          <button
            className={rangePreset === '6m' ? 'active' : ''}
            onClick={async () => {
              const hoy = new Date();
              const from = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);
              setFromDate(from);
              setToDate(hoy);
              setRangePreset('6m');
              setGroupBy('month');
              await loadSerie(from, hoy, 'month');
              await loadTop(from, hoy);
            }}
          >
            Últimos 6 meses
          </button>
          <button
            className={rangePreset === '12m' ? 'active' : ''}
            onClick={async () => {
              const hoy = new Date();
              const from = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1);
              setFromDate(from);
              setToDate(hoy);
              setRangePreset('12m');
              setGroupBy('month');
              await loadSerie(from, hoy, 'month');
              await loadTop(from, hoy);
            }}
          >
            Últimos 12 meses
          </button>
        </div>
        <div className="custom-range">
          <label>
            Desde
            <input
              type="date"
              value={fromDate ? new Date(fromDate).toISOString().slice(0, 10) : ''}
              onChange={e => {
                const d = new Date(e.target.value);
                setFromDate(d);
              }}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              value={toDate ? new Date(toDate).toISOString().slice(0, 10) : ''}
              onChange={e => {
                const d = new Date(e.target.value);
                setToDate(d);
              }}
            />
          </label>
          <label>
            Agrupar por
            <select
              value={groupBy}
              onChange={async e => {
                const gb = e.target.value;
                setGroupBy(gb);
                if (fromDate && toDate) {
                  await loadSerie(fromDate, toDate, gb);
                }
              }}
            >
              <option value="day">Día</option>
              <option value="month">Mes</option>
            </select>
          </label>
          <button
            onClick={async () => {
              if (!fromDate || !toDate) return;
              await loadSerie(fromDate, toDate, groupBy);
              await loadTop(fromDate, toDate);
            }}
          >
            Actualizar
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon ventas"><FaDollarSign /></div>
          <div className="kpi-info">
            <span className="kpi-title">Ingresos en rango</span>
            <span className="kpi-value">{formatPriceCL(ingresosRango)}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon usuarios"><FaUsers /></div>
          <div className="kpi-info">
            <span className="kpi-title">Ventas en rango</span>
            <span className="kpi-value">{ventasRango}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon productos"><FaBox /></div>
          <div className="kpi-info">
            <span className="kpi-title">Productos activos</span>
            <span className="kpi-value">{productosActivos}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon compras"><FaShoppingCart /></div>
          <div className="kpi-info">
            <span className="kpi-title">Compras del mes</span>
            <span className="kpi-value">{comprasMes} · {formatPriceCL(gastadoMes)}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon ingresos"><FaDollarSign /></div>
          <div className="kpi-info">
            <span className="kpi-title">Promedio mensual de ventas</span>
            <span className="kpi-value">{formatPriceCL(monthlyAvgRevenue)}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon compras"><FaShoppingCart /></div>
          <div className="kpi-info">
            <span className="kpi-title">Promedio mensual de pedidos</span>
            <span className="kpi-value">{Number(monthlyAvgOrders || 0).toFixed(1)}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon productos"><FaBox /></div>
          <div className="kpi-info">
            <span className="kpi-title">Promedio unidades (Top productos, mes)</span>
            <span className="kpi-value">{Number(avgTopProductosMes || 0).toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-header"><h3>Productos más vendidos</h3></div>
          <div className="chart-body"><Bar data={barTopVendidos} options={chartOptions} /></div>
        </div>
        <div className="chart-card">
          <div className="chart-header"><h3>Ingresos por {groupBy === 'day' ? 'día' : 'mes'}</h3></div>
          <div className="chart-body">{serieLoading ? <div className="mini-spinner"></div> : <Line data={lineSerieVentas} options={chartOptions} />}</div>
        </div>
        <div className="chart-card">
          <div className="chart-header"><h3>Estado de productos</h3></div>
          <div className="chart-body donut"><Doughnut data={donutProductos} options={{ ...chartOptions, plugins: { legend: { display: true, position: 'bottom' } } }} /></div>
        </div>
        <div className="chart-card">
          <div className="chart-header"><h3>Clientes recurrentes del mes (Top 5)</h3></div>
          <div className="chart-body">
            {topClientesMes && topClientesMes.length > 0 ? (
              <table className="tabla-top-clientes" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Cliente</th>
                    <th style={{ textAlign: 'center', padding: '8px' }}>Compras</th>
                    <th style={{ textAlign: 'right', padding: '8px' }}>Monto Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topClientesMes.map((c, idx) => (
                    <tr key={`top-cliente-${idx}`}>
                      <td style={{ padding: '8px' }}>{c.Cliente || c.nombre || c.cliente || 'Cliente'}</td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>{c.Compras ?? c.compras ?? 0}</td>
                      <td style={{ textAlign: 'right', padding: '8px' }}>{formatPriceCL(Number(c.MontoTotal ?? c.montoTotal ?? 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="mini-spinner"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;

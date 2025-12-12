import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import './AreaTable.scss';

// TODO: Obtener datos reales desde la API
const ventasMensuales = [];
const productos = [];
const clientes = [];

const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const colors = ['#ffc107', '#ffb300', '#ff9800', '#ff5722', '#795548', '#607d8b', '#9e9e9e'];

const Dashboard = () => {
  const promedioVentas = Math.round(ventasMensuales.reduce((a, b) => a + b, 0) / ventasMensuales.length);


  const barVentas = meses.map((mes, i) => ({ mes, valor: ventasMensuales[i] }));


  return (
    <div className="dashboard-wrapper">
 
      <div className="dashboard-container">
        <div className="panel dark promedio-panel">
          <h3>Ventas</h3>
          <p className="tag">Promedio: {promedioVentas}</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barVentas}>
              <XAxis 
                dataKey="mes" 
                tick={{ fontSize: 12, fontFamily: 'Inter', fill: '#ffffff' }}
                axisLine={{ stroke: '#ffc107' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fontFamily: 'Inter', fill: '#ffffff' }}
                axisLine={{ stroke: '#ffc107' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#2c3e50',
                  border: '1px solid #ffc107',
                  borderRadius: '8px',
                  fontFamily: 'Inter'
                }}
              />
              <Bar dataKey="valor" fill="#ffc107" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel-row">
          <div className="panel dark xsmall">
            <h3>Clientes Recurrentes</h3>
            <table>
              <thead>
                <tr><th>Puesto</th><th>Nombre</th></tr>
              </thead>
              <tbody>
                {clientes.map((c, i) => (
                  <tr key={c?.id ?? c?.nombre ?? i}>
                    <td className="puesto-numero">{i + 1}</td>
                    <td className="cliente-nombre">{c.nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel dark wide">
            <h3>Productos Más Vendidos</h3>
            <div className="productos-panel-wide">
              <div className="grafico-pastel">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={productos}
                      dataKey="ventas"
                      nameKey="nombre"
                      outerRadius={85}
                      innerRadius={30}
                      labelLine={false}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelStyle={{ 
                        fontSize: '12px', 
                        fontFamily: 'Inter', 
                        fontWeight: '600',
                        fill: '#2c3e50'
                      }}
                    >
                      {productos.map((entry, index) => (
                        <Cell 
                          key={`pie-cell-${entry?.id ?? entry?.nombre ?? index}`} 
                          fill={colors[index % colors.length]}
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #ffc107',
                        borderRadius: '12px',
                        fontFamily: 'Inter',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <ul className="leyenda-vertical">
                  {productos.map((item, index) => (
                    <li key={item?.id ?? item?.nombre ?? index} style={{ color: colors[index % colors.length] }}>
                      {item.nombre}
                    </li>
                  ))}
                </ul>
              </div>

              <table>
                <thead>
                  <tr><th>Nombre</th><th>Ventas Totales</th></tr>
                </thead>
                <tbody>
                  {productos.map((p, i) => (
                    <tr key={p?.id ?? p?.nombre ?? i}>
                      <td>{p.nombre}</td>
                      <td>{p.ventas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

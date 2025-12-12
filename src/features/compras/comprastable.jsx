import React, { useState } from 'react';
import './ComprasTable.scss';

const ComprasTable = () => {
  const [compras, setCompras] = useState([
    { id: 1, fecha: '2025-05-27', proveedor: 'Distribuidora Pet', total: 450000, anulada: false },
    { id: 2, fecha: '2025-05-20', proveedor: 'Mundo Mascota', total: 300000, anulada: false },
    { id: 3, fecha: '2025-05-18', proveedor: 'Pet World S.A.', total: 525000, anulada: true },
  ]);

  const [busqueda, setBusqueda] = useState('');

  const toggleAnularCompra = (id) => {
    setCompras(
      compras.map(c =>
        c.id === id ? { ...c, anulada: !c.anulada } : c
      )
    );
  };

  const comprasFiltradas = compras.filter(c =>
    c.proveedor.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="compras-table">
      <div className="compras-table-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h3 className="compras-title">Últimas Compras</h3>
        <input
          type="text"
          placeholder="Buscar proveedor..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Proveedor</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {comprasFiltradas.map(c => (
            <tr key={c.id} style={{ opacity: c.anulada ? 0.5 : 1 }}>
              <td>{c.fecha}</td>
              <td>{c.proveedor}</td>
              <td>${c.total.toLocaleString()}</td>
              <td>
                {c.anulada ? (
                  <span className="status anulado">Anulada</span>
                ) : (
                  <span className="status success">Activa</span>
                )}
              </td>
              <td>
                <button
                  className={`btn btn-sm ${c.anulada ? 'btn-outline-success' : 'btn-outline-danger'}`}
                  onClick={() => toggleAnularCompra(c.id)}
                  style={{marginRight: '5px'}}
                >
                  {c.anulada ? 'Reactivar' : 'Anular'}
                </button>
                <button
                  className="btn btn-sm btn-outline-warning"
                  onClick={() => alert(`Detalles de compra:\nProveedor: ${c.proveedor}\nFecha: ${c.fecha}\nTotal: $${c.total.toLocaleString()}`)}
                >
                  Ver
                </button>
              </td>
            </tr>
          ))}
          {comprasFiltradas.length === 0 && (
            <tr>
              <td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>
                No se encontraron compras
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ComprasTable;

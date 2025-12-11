import React from 'react';

const ProveedoresActions = ({ proveedor, onView, onEstado, onDelete }) => {
  return (
    <div className="proveedores-actions">
      <button
        className="btn btn-sm btn-outline-primary"
        onClick={() => onView(proveedor)}
      >
        Ver
      </button>
      <button
        className="btn btn-sm btn-outline-warning"
        onClick={() => onEstado(proveedor.id)}
      >
        Estado
      </button>
      <button
        className="btn btn-sm btn-outline-danger"
        onClick={() => onDelete(proveedor.id)}
      >
        Eliminar
      </button>
    </div>
  );
};

export default ProveedoresActions;

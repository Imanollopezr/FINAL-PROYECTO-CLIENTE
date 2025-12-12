import React from 'react';

const ClientesActions = ({ cliente, onView, onEdit, onDelete }) => {
  return (
    <div className="clientes-actions d-inline">
      <button
        className="btn btn-sm btn-outline-primary me-1"
        onClick={() => onView(cliente)}
      >
        Ver
      </button>
      <button
        className="btn btn-sm btn-outline-success me-1"
        onClick={() => onEdit(cliente)}
      >
        Editar
      </button>
      <button
        className="btn btn-sm btn-outline-danger"
        onClick={() => onDelete(cliente.id)}
      >
        Eliminar
      </button>
    </div>
  );
};

export default ClientesActions;

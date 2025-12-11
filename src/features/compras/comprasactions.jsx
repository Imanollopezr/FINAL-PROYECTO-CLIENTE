import React from 'react';

const ComprasActions = ({ compra, onView, onEdit, onDelete }) => {
  return (
    <div className="compras-actions">
      <button 
        className="btn btn-sm btn-outline-primary me-1" 
        onClick={() => onView(compra)}
      >
        Ver
      </button>
      <button 
        className="btn btn-sm btn-outline-success me-1" 
        onClick={() => onEdit(compra)}
      >
        Editar
      </button>
      <button 
        className="btn btn-sm btn-outline-danger" 
        onClick={() => onDelete(compra.id)}
      >
        Eliminar
      </button>
    </div>
  );
};

export default ComprasActions;

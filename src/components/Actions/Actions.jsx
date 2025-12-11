import React from 'react';
import { MdVisibility, MdEdit, MdDelete } from 'react-icons/md';

const Actions = ({ obj, onView, onEdit, onDelete }) => {
  return (
    <div className="obj-actions">
      <button 
        className="btn btn-sm btn-outline-primary me-1" 
        onClick={() => onView(obj)}
        disabled={obj.estado === false}
      >
        <MdVisibility className="me-1" size={18} /> 
      </button>
      <button 
        className="btn btn-sm btn-outline-success me-1" 
        onClick={() => onEdit(obj)}
        disabled={obj.estado === false}
      >
        <MdEdit className="me-1" size={18} /> 
      </button>
      <button 
        className="btn btn-sm btn-outline-danger" 
        onClick={() => onDelete(obj.id)}
        disabled={obj.estado === false}
      >
        <MdDelete className="me-1" size={18} /> 
      </button>
    </div>
  );
};

export default Actions;

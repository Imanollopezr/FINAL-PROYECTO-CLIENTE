import React from 'react';
import './AgregarButton.scss';

const AgregarButton = ({ 
  onClick, 
  children = 'Agregar', 
  title, 
  className = '', 
  disabled = false,
  ...props 
}) => {
  return (
    <button 
      className={`btn-agregar ${className}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default AgregarButton;
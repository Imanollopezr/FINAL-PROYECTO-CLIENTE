import React from 'react';
import OptimizedImage from './OptimizedImage';

const ClientAvatar = ({ nombre, tipo = 'cliente', className = '', size = 'medium' }) => {
  // Mapeo de tamaños
  const sizeMap = {
    small: '100x100',
    medium: '150x150',
    large: '200x200'
  };
  
  const dimensions = sizeMap[size] || sizeMap.medium;
  
  // Imágenes de personas con mascotas de Unsplash
  const getClientImageUrl = (nombre, tipo) => {
    const clientImages = [
      `https://images.unsplash.com/photo-1554151228-14d9def656e4?w=${dimensions}&auto=format&fit=crop&q=80`, // Woman with dog
      `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=${dimensions}&auto=format&fit=crop&q=80`, // Man with dog
      `https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=${dimensions}&auto=format&fit=crop&q=80`, // Woman with cat
      `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=${dimensions}&auto=format&fit=crop&q=80`, // Man portrait
      `https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=${dimensions}&auto=format&fit=crop&q=80`, // Woman portrait
      `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=${dimensions}&auto=format&fit=crop&q=80`, // Man with pet
      `https://images.unsplash.com/photo-1494790108755-2616b612b786?w=${dimensions}&auto=format&fit=crop&q=80`, // Woman portrait
      `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=${dimensions}&auto=format&fit=crop&q=80`, // Man portrait
    ];
    
    // Seleccionar imagen basada en el nombre para consistencia
    const index = nombre ? nombre.length % clientImages.length : 0;
    return clientImages[index];
  };

  const getInitials = (nombre) => {
    if (!nombre) return 'CL';
    const words = nombre.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  };

  const getPlaceholder = (nombre) => {
    return getInitials(nombre);
  };

  const getFallback = (nombre) => {
    return (
      <div className="avatar-initials">
        {getInitials(nombre)}
      </div>
    );
  };

  return (
    <div className={`client-avatar ${className}`}>
      <OptimizedImage
        src={getClientImageUrl(nombre, tipo)}
        alt={`Avatar de ${nombre}`}
        className="avatar-image"
        placeholder={getPlaceholder(nombre)}
        fallback={getFallback(nombre)}
        aspectRatio="1/1"
        objectFit="cover"
      />
    </div>
  );
};

export default ClientAvatar;
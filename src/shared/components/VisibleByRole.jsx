import React from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';

const VisibleByRole = ({ allowedRoles = [], children, fallback = null }) => {
  const { user } = useAuth();
  const role = (user?.role || 'Usuario').trim();
  const isVisible = allowedRoles.length === 0 || allowedRoles.includes(role);
  return isVisible ? children : fallback;
};

export default VisibleByRole;
// src/components/RoleGuard.jsx
import { useAuth } from '../context/AuthContext';

export const RoleGuard = ({ roles, children }) => {
  const { hasPermission } = useAuth();
  return hasPermission(roles) ? children : null;
};
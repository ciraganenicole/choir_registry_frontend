import { Navigate, useLocation } from 'react-router-dom';

import { UserRole } from '../user/type';
import { useAuth } from './auth-context';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
}) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Redirect to login if no user is authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to home page if user doesn't have required role
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Helper function to check if user has required role
export const hasRole = (
  userRole: UserRole,
  requiredRole: UserRole,
): boolean => {
  // SUPER_ADMIN has access to everything
  if (userRole === UserRole.SUPER_ADMIN) {
    return true;
  }

  return userRole === requiredRole;
};

// Helper function to check if user has any of the required roles
export const hasAnyRole = (
  userRole: UserRole,
  requiredRoles: UserRole[],
): boolean => {
  // SUPER_ADMIN has access to everything
  if (userRole === UserRole.SUPER_ADMIN) {
    return true;
  }

  return requiredRoles.includes(userRole);
};

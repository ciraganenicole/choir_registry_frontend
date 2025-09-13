import { useRouter } from 'next/router';
import { useEffect } from 'react';

import type { UserRole } from '@/lib/user/type';
import { UserCategory } from '@/lib/user/type';
import { useAuth } from '@/providers/AuthProvider';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectPath?: string;
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  redirectPath = '/auth/login',
}) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // Check if the current path is allowed for the user's role
      const hasRequiredRole = allowedRoles.includes(user.role);

      // Special cases for routes that should be accessible by LEAD category
      const isLeadsRoute = router.pathname === '/admin/users/leads';
      const hasLeadCategory = user.categories?.includes(UserCategory.LEAD);

      // Special access logic for LEAD category users
      let hasAccess = hasRequiredRole;

      // LEAD users should have access to leads route regardless of their role
      if (hasLeadCategory && isLeadsRoute) {
        hasAccess = true;
      }

      // Debug logging removed for cleaner code

      if (!hasAccess) {
        router.push(redirectPath);
      }
    }
  }, [user, isLoading, allowedRoles, redirectPath, router]);

  if (isLoading) {
    return null; // or a loading spinner
  }

  // Check if user has access to this route
  const hasRequiredRole = user && allowedRoles.includes(user.role);
  const isLeadsRoute = router.pathname === '/admin/users/leads';
  const hasLeadCategory = user?.categories?.includes(UserCategory.LEAD);

  // Special access logic for LEAD category users
  let hasAccess = hasRequiredRole;

  // LEAD users should have access to leads route regardless of their role
  if (hasLeadCategory && isLeadsRoute) {
    hasAccess = true;
  }

  // Debug logging removed for cleaner code

  if (!user || !hasAccess) {
    return null;
  }

  return <>{children}</>;
};

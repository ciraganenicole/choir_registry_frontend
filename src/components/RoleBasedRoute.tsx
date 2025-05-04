import { useRouter } from 'next/router';
import { useEffect } from 'react';

import type { UserRole } from '@/lib/user/type';
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
      const hasAccess = allowedRoles.includes(user.role);

      if (!hasAccess) {
        console.log('Access denied:', {
          path: router.pathname,
          userRole: user.role,
          allowedRoles,
        });
        router.push(redirectPath);
      }
    }
  }, [user, isLoading, allowedRoles, redirectPath, router]);

  if (isLoading) {
    return null; // or a loading spinner
  }

  // Check if user has access to this route
  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};

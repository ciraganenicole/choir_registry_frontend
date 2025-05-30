// src/pages/_app.tsx
import '../styles/global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import OfflineIndicator from '@/components/pwa/OfflineIndicator';
import { UserRole } from '@/lib/user/type';
import { persistor, store } from '@/store';

import { ProtectedRoute } from '../components/ProtectedRoute';
import { RoleBasedRoute } from '../components/RoleBasedRoute';
import { AuthProvider } from '../providers/AuthProvider';

// Add paths that should be protected
const protectedPaths = [
  '/dashboard',
  '/profile',
  '/admin',
  '/attendance',
  '/transaction',
  '/admin/users',
];

// Define role-based routes
const roleBasedRoutes = {
  [UserRole.FINANCE_ADMIN]: ['/transaction', '/admin/users'],
  [UserRole.ATTENDANCE_ADMIN]: ['/attendance', '/admin/users'],
  [UserRole.SUPER_ADMIN]: [
    '/admin',
    '/attendance',
    '/transaction',
    '/admin/users',
  ],
  [UserRole.USER]: ['/profile'],
};

export default function App({ Component, pageProps, router }: AppProps) {
  // Ensure a stable QueryClient instance
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            // console.log('SW registered:', registration); // Removed to fix linter warning

            // Handle updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (
                    newWorker.state === 'installed' &&
                    navigator.serviceWorker.controller
                  ) {
                    // New content is available, show update prompt
                    // TODO: Replace with a custom modal/dialog for user confirmation
                    // if (confirm('New version available! Reload to update?')) {
                    //   window.location.reload();
                    // }
                    window.location.reload(); // Immediate reload for now
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error('SW registration failed:', error);
          });
      });

      // Handle controller change (new service worker activated)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  // Check if current route is protected
  const isProtectedRoute = protectedPaths.some((path) =>
    router.pathname.startsWith(path),
  );

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {isProtectedRoute ? (
              <ProtectedRoute>
                <RoleBasedRoute
                  allowedRoles={Object.entries(roleBasedRoutes)
                    .filter(([_, paths]) =>
                      paths.some((path) => router.pathname.startsWith(path)),
                    )
                    .map(([role]) => role as UserRole)}
                >
                  <Component {...pageProps} />
                </RoleBasedRoute>
              </ProtectedRoute>
            ) : (
              <Component {...pageProps} />
            )}
          </AuthProvider>
          <OfflineIndicator />
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}

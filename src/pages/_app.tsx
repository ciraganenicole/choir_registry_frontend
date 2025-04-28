// src/pages/_app.tsx
import '../styles/global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import OfflineIndicator from '@/components/pwa/OfflineIndicator';
import { persistor, store } from '@/store';

import { ProtectedRoute } from '../components/ProtectedRoute';
import { AuthProvider } from '../providers/AuthProvider';

// Add paths that should be protected
const protectedPaths = [
  '/dashboard',
  '/profile',
  '/admin',
  '/attendance',
  '/transaction',
  // Add other protected routes here
];

export default function App({ Component, pageProps, router }: AppProps) {
  // Ensure a stable QueryClient instance
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

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
                <Component {...pageProps} />
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

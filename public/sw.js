/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'choir-registry-v1';

// List of Next.js development files that should bypass the service worker
const NEXTJS_FILES = [
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/react-refresh.js',
  '/_next/static/chunks/pages/_app.js',
  '/_next/static/chunks/pages/index.js',
  '/_next/static/development/_buildManifest.js',
  '/_next/static/development/_ssgManifest.js',
  '/_next/static/webpack/',
  '/_next/webpack-hmr',
];

// Check if a URL matches any Next.js development files
function isNextJsFile(url) {
  return (
    NEXTJS_FILES.some((file) => url.pathname.startsWith(file)) ||
    url.pathname.startsWith('/_next/static/webpack/') ||
    url.pathname.startsWith('/_next/static/development/')
  );
}

// Service Worker event listeners
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Only cache the root path initially
      return cache.add('/').catch(() => {
        return Promise.resolve();
      });
    }),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip all non-HTTP/HTTPS requests and Chrome extensions
  if (
    !url.protocol.startsWith('http') ||
    url.protocol === 'chrome-extension:'
  ) {
    return; // Let the browser handle these requests
  }

  // Skip Next.js development files
  if (isNextJsFile(url)) {
    return; // Let Next.js handle these requests normally
  }

  // Skip all API and auth requests - let them go through normally
  if (url.pathname.startsWith('/') || url.pathname.includes('/auth/')) {
    return; // Let the browser handle these requests normally
  }

  // For static assets only, try network first, then cache
  if (request.method === 'GET' && !url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful responses for static assets
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone).catch(() => {});
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request).then((response) => {
            if (response) {
              return response;
            }
            // If no cache, let the browser handle the error
            throw new Error('Network error');
          });
        }),
    );
  }
});

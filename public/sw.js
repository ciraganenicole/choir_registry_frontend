/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'choir-registry-v1';
const AUTH_CACHE_NAME = 'choir-registry-auth-v1';

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

// Create a response for offline scenarios
function createOfflineResponse(
  message = 'You are offline. Please check your connection.',
) {
  return new Response(
    JSON.stringify({
      error: message,
      offline: false,
      status: 503,
    }),
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Is-Offline': 'false',
      },
    },
  );
}

// Handle auth requests based on the specific endpoint
async function handleAuthRequest(request, url) {
  // Special handling for login endpoint
  if (url.pathname.endsWith('/auth/login')) {
    try {
      if (!navigator.onLine) {
        return createOfflineResponse(
          'You are offline. Please check your connection.',
        );
      }
      const response = await fetch(request);
      if (response.ok) {
        // Cache successful login response
        const cache = await caches.open(AUTH_CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      return createOfflineResponse(
        'Unable to login while offline. Please check your internet connection.',
      );
    }
  }

  // For other auth endpoints
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(AUTH_CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Try to get cached auth response
    const cache = await caches.open(AUTH_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return createOfflineResponse();
  }
}

// Service Worker event listeners
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Only cache the root path initially
      return cache.add('/').catch((error) => {
        console.log('Cache add failed:', error);
        // Continue with installation even if caching fails
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

  // Skip API requests in offline mode
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).catch(() => createOfflineResponse()));
    return;
  }

  // Handle auth requests
  if (url.pathname.includes('/auth/')) {
    event.respondWith(handleAuthRequest(request, url));
    return;
  }

  // For all other requests, try network first, then cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful responses
        if (response.ok && !url.pathname.startsWith('/_next/')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone).catch((error) => {
              console.log('Failed to cache response:', error);
            });
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches
          .match(request)
          .then((response) => response || createOfflineResponse());
      }),
  );
});

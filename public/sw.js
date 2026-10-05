// Service Worker para SCVehículos PWA - Ministerio de Educación San Juan
const CACHE_NAME = 'scvehiculos-shell-v1';
const RUNTIME_CACHE = 'scvehiculos-runtime-v1';

// Recursos críticos a precachear durante la instalación
const PRECACHE_ASSETS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/icon.svg',
  '/branding/logo san juan 2.png',
];

// Evento Install: Precachear shell inicial
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[PWA SW] Precache warning:', err);
      })
  );
});

// Evento Activate: Limpiar cachés antiguas y tomar control inmediato
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Evento Fetch: Estrategias según tipo de recurso
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar esquemas que no sean http/https (e.g. chrome-extension:)
  if (!url.protocol.startsWith('http')) return;

  // 1. Peticiones a la API (/api/): Estrategia Network Only con respuesta Offline JSON
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            offline: true,
            error: 'Estás sin conexión a internet. Los cambios no pudieron enviarse al servidor.',
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // 2. Solo cachear peticiones GET
  if (request.method !== 'GET') {
    return;
  }

  // 3. Navegación HTML (páginas): Network First con fallback a offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, copy).catch(() => {});
            });
          }
          return response;
        })
        .catch(async () => {
          // Intentar obtener la página de la caché
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si no está en caché, servir la pantalla de contingencia offline
          const offlinePage = await caches.match('/offline.html');
          if (offlinePage) {
            return offlinePage;
          }
          return new Response('Sin conexión a internet.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
    );
    return;
  }

  // 4. Recursos estáticos (_astro, imágenes, fuentes, iconos, css, js)
  // Estrategia: Stale-While-Revalidate (o Cache First)
  const isStaticAsset =
    url.pathname.startsWith('/_astro/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/branding/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.woff2');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, copy).catch(() => {});
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 5. Por defecto: Network First
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Escuchar mensaje para forzar skipWaiting desde la UI
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// ══════════════════════════════════════════════
// BarrCan Service Worker
// Estrategia: Cache First + Background Update
// ══════════════════════════════════════════════

const CACHE_VERSION = 'barrcan-v2';

// Recursos que se cachean en la primera carga
const RECURSOS_CORE = [
  './barrcan_app.html',
  './barrcan_sw.js',
];

// URLs de fuentes de Google — se cachean la primera vez que se piden
const DOMINIOS_CACHEABLE = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// ── INSTALL: precachea el HTML principal ──────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(RECURSOS_CORE);
    }).then(() => {
      // Activa inmediatamente sin esperar a que cierren otras pestañas
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE: limpia cachés viejas ────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(claves => {
      return Promise.all(
        claves
          .filter(clave => clave !== CACHE_VERSION)
          .map(clave => {
            console.log('[BarrCan SW] Eliminando caché antigua:', clave);
            return caches.delete(clave);
          })
      );
    }).then(() => {
      // Toma control de todas las pestañas abiertas inmediatamente
      return self.clients.claim();
    })
  );
});

// ── FETCH: Cache First con actualización en fondo ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Solo manejamos GET
  if (event.request.method !== 'GET') return;

  // Recursos locales (el HTML y el SW mismo)
  const esLocal = url.origin === self.location.origin;

  // Fuentes de Google
  const esFuente = DOMINIOS_CACHEABLE.some(d => url.hostname.includes(d));

  if (esLocal || esFuente) {
    event.respondWith(cachePrimeroConActualizacion(event.request));
  }
  // Cualquier otra petición (APIs, etc.) va directo a red
});

// ── Estrategia Cache First + Background Update ──
async function cachePrimeroConActualizacion(request) {
  const cache     = await caches.open(CACHE_VERSION);
  const cached    = await cache.match(request);

  // Lanzamos fetch en paralelo sin esperar (actualización en fondo)
  const fetchPromise = fetch(request)
    .then(respuesta => {
      if (respuesta && respuesta.status === 200) {
        // Guardamos la versión fresca en caché para la próxima vez
        cache.put(request, respuesta.clone());
      }
      return respuesta;
    })
    .catch(() => null); // Sin internet: el fetch falla silenciosamente

  // Si tenemos caché, la devolvemos de inmediato (rápido)
  // Si no hay caché (primera vez), esperamos la red
  return cached || fetchPromise;
}

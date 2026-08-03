// ══════════════════════════════════════════════
// BarrCan Service Worker v9 — Offline First
// Estrategia: Network-First para HTML (páginas .html),
//             Cache-First para fuentes/CDN,
//             Supabase y APIs externas: Network Only
// ══════════════════════════════════════════════
//
// CAMBIO DE RAÍZ v9: antes TODO el sitio (incluidas las páginas .html)
// usaba "Cache First" -- eso significa que la primera carga SIEMPRE
// mostraba la versión guardada de antes, y la nueva solo se guardaba
// en segundo plano para la SIGUIENTE vez que se abriera. Cada arreglo
// que se subía a GitHub necesitaba dos recargas para verse: la primera
// mostraba lo viejo (mientras bajaba lo nuevo por detrás sin avisar),
// la segunda ya mostraba lo nuevo. Eso pasó en más de un módulo hoy.
//
// Ahora las páginas .html se piden con "Network First": si hay señal,
// siempre se trae la versión más reciente de GitHub de una vez (y de
// paso se actualiza el caché). Solo si NO hay señal se usa el caché
// como respaldo -- así el offline-first para trabajar en campo sigue
// intacto, pero con señal ya no hace falta recargar dos veces.
// Fuentes/CDN (que casi nunca cambian) se quedan en Cache First porque
// ahí sí conviene la velocidad sobre la frescura.

const CACHE_VERSION = 'barrcan-v9'; // subir este número fuerza que TODOS los
// dispositivos descarten su caché vieja de una vez -- ya no debería
// hacer falta subirlo por cada arreglo ahora que HTML es Network First,
// pero sigue disponible por si algún día conviene un reinicio total.

const RECURSOS_CORE = [
  './barrcan_app.html',
  './garantia_publica.html',
  './barrcan_brain.html',
  './historial.html',
  './pagos.html',
  './entregas.html',
  './ordenes.html',
  './compras.html',
  './cotizador_nacional.html',
  './cotizador_espanol.html',
  './cotizador_eurovent.html',
  './cotizador_servicios.html',
  './cotizador_banos.html',
];

const DOMINIOS_CACHEABLE = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net',
];

// Dominios que NUNCA se cachean (siempre network)
const DOMINIOS_NETWORK_ONLY = [
  'supabase.co',
  'supabase.com',
];

// ── INSTALL ───────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(RECURSOS_CORE))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ──────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(claves =>
      Promise.all(
        claves
          .filter(c => c !== CACHE_VERSION)
          .map(c => {
            console.log('[BarrCan SW] Eliminando caché antigua:', c);
            return caches.delete(c);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────
self.addEventListener('fetch', event => {
  // Solo GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // NETWORK ONLY — Supabase y APIs externas nunca se cachean
  const esNetworkOnly = DOMINIOS_NETWORK_ONLY.some(d => url.hostname.includes(d));
  if (esNetworkOnly) return; // deja pasar sin interceptar

  const esLocal     = url.origin === self.location.origin;
  const esCacheable = DOMINIOS_CACHEABLE.some(d => url.hostname.includes(d));

  // NETWORK FIRST — páginas .html (y navegación directa): siempre la
  // versión más reciente si hay señal, caché solo como respaldo offline.
  const esHTML = event.request.mode === 'navigate' || url.pathname.endsWith('.html');
  if (esLocal && esHTML) {
    event.respondWith(redPrimero(event.request));
    return;
  }

  // CACHE FIRST — el resto del app shell local y fuentes/CDN externas
  if (esLocal || esCacheable) {
    event.respondWith(cachePrimero(event.request));
  }
});

async function redPrimero(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    // Sin señal: usar lo último que se guardó como respaldo offline
    const cached = await cache.match(request);
    if (cached) return cached;
    throw e;
  }
}

async function cachePrimero(request) {
  const cache  = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);

  // Actualizar en background
  const fetchPromise = fetch(request)
    .then(response => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || fetchPromise;
}

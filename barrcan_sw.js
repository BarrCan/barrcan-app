// ══════════════════════════════════════════════
// BarrCan Service Worker v8 — Offline First
// Estrategia: Cache First para app shell
// Supabase y APIs externas: Network Only
// ══════════════════════════════════════════════

const CACHE_VERSION = 'barrcan-v8'; // subir este número fuerza que TODOS los
// dispositivos descarten su caché vieja y vuelvan a bajar todo de GitHub —
// úsalo cada vez que subas cambios importantes y quieras que se reflejen
// de inmediato, no solo hasta la segunda recarga.

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

  // CACHE FIRST — app shell y fuentes
  const esLocal     = url.origin === self.location.origin;
  const esCacheable = DOMINIOS_CACHEABLE.some(d => url.hostname.includes(d));

  if (esLocal || esCacheable) {
    event.respondWith(cachePrimero(event.request));
  }
});

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

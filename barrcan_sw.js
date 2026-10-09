// ══════════════════════════════════════════════
// BarrCan Service Worker v18 — Offline First
// Estrategia: Network-First con timeout para HTML (páginas .html),
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
//
// FIX v10 — señal débil dejaba la app "colgada" en vez de offline:
// "Network First" sin límite de tiempo funciona bien SIN señal (el
// fetch falla al toque y cae al caché), pero con señal DÉBIL el fetch
// no falla -- se queda intentando mucho más de lo que alguien espera
// parado en campo, y mientras tanto no pasa nada. Ahora hay una
// carrera contra 3 segundos: si no hay respuesta a tiempo, se usa el
// caché de inmediato (el fetch real sigue aparte por si actualiza el
// caché para la próxima vez). También se agregaron a la precarga 10
// módulos que faltaban (clientes, garantias, visitas, bodega,
// inventario, costos, reportes, tecnicos, mostrador, render_ia) --
// si nunca se habían abierto con señal antes, no tenían nada guardado
// para usar sin conexión.

// FIX v11 (30-sep-2026):
// 1) Faltaban 11 módulos en la precarga (taller, cubiertas, adicionales,
//    logistica, estado_cuenta, codigos_promocionales, finanzas_personales,
//    guia_configuraciones, mensajes, encuesta_publica, limpieza_storage) --
//    si nunca se abrieron con señal en ese celular, sin señal no abrían.
// 2) Baños carga sus cálculos de Aluminio/Polietileno desde modulos/*.js
//    solo cuando se ocupan; no estaban precargados, así que sin señal ese
//    cálculo fallaba aunque la página sí abriera. Ya se precargan.
// 3) La instalación usaba cache.addAll(): si UN solo archivo fallaba (ej.
//    se renombra o borra uno), se caía TODA la precarga sin avisar y el
//    celular quedaba sin nada para trabajar offline. Ahora se guarda uno
//    por uno: si alguno falla, los demás sí quedan.

// v12 (04-oct-2026): precarga modulos/presupuesto_doc.js (documento oficial).
// v13 (04-oct-2026): los .js locales (modulos/*.js, como el documento
// oficial de presupuesto) ahora también son RED PRIMERO. Antes eran caché
// primero: un cambio (ej. el correo de facturación) no se veía hasta la
// segunda apertura, porque se servía la copia vieja guardada.
// v14 (04-oct-2026): precarga ver_doc.html y modulos/abrir_doc.js (documentos con folio).
// v15 (05-oct-2026): precarga modulos/etiquetas.js (etiquetas QR por Bluetooth).
// v16 (05-oct-2026): precarga diseñador de etiquetas y generador de QR.
// v17 (05-oct-2026): páginas y .js siempre se revalidan con GitHub.
// v18 (08-oct-2026): precarga los logos (assets/logo-icono.jpg, logo-oficial.jpg).
const CACHE_VERSION = 'barrcan-v19'; // subir este número fuerza que TODOS los
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
  './clientes.html',
  './garantias.html',
  './visitas.html',
  './bodega.html',
  './inventario.html',
  './costos.html',
  './reportes.html',
  './tecnicos.html',
  './mostrador.html',
  './render_ia.html',
  './config.html',
  './cotizador_stands.html',
  './cotizador_cubiertas.html',
  './taller.html',
  './adicionales.html',
  './logistica.html',
  './estado_cuenta.html',
  './codigos_promocionales.html',
  './finanzas_personales.html',
  './guia_configuraciones.html',
  './mensajes.html',
  './encuesta_publica.html',
  './limpieza_storage.html',
  // Módulos de cálculo que Baños carga bajo demanda
  './modulos/alupol_recto.js',
  './modulos/alupol_escuadra.js',
  './modulos/alupol_cor_luj_2h.js',
  './modulos/presupuesto_doc.js',
  './modulos/abrir_doc.js',
  './modulos/etiquetas.js',
  './assets/logo-icono.jpg',
  './assets/logo-oficial.jpg',
  './modulos/qrcode.js',
  './etiquetas_disenar.html',
  './ver_doc.html',
  './ver_reporte.html',
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
      .then(cache => Promise.allSettled(RECURSOS_CORE.map(u => cache.add(u))).then(res => {
        const fallidos = res.filter(r => r.status === 'rejected').length;
        console.log('[BarrCan SW] Precarga: ' + (RECURSOS_CORE.length - fallidos) + '/' + RECURSOS_CORE.length);
      }))
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
  const esHTML = event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js');
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

  // Con señal débil, fetch() no falla rápido -- se queda "colgado"
  // intentando mucho más tiempo del que alguien va a esperar parado
  // en campo. Se hace una carrera: si a los 3s no hay respuesta, se
  // usa el caché de inmediato (y el fetch real sigue en segundo plano
  // por si acaso llega y conviene actualizar el caché para la próxima).
  const TIMEOUT_MS = 3000;

  // v17: siempre revalidar con GitHub (cache:'no-cache'). Antes fetch()
  // aceptaba la copia del propio navegador -- GitHub permite guardarla
  // 10 min -- y una versión recién publicada no se veía aunque se
  // recargara. Si no hay cambios, GitHub responde 304 en milisegundos.
  // (Una petición de navegación no admite opciones: se rearma por URL.)
  const pedido = new Request(request.url, { cache: 'no-cache', credentials: 'same-origin', redirect: 'follow' });
  const fetchPromise = fetch(pedido).then(response => {
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  });

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('timeout-señal-débil')), TIMEOUT_MS);
  });

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (e) {
    // Se agotó el tiempo o falló la red: usar lo último guardado.
    // El fetch real sigue corriendo aparte (fetchPromise no se cancela)
    // y si llega a tiempo, ya dejó actualizado el caché para la próxima.
    fetchPromise.catch(() => {}); // evitar "unhandled rejection" si también falla
    const cached = await cache.match(request);
    if (cached) return cached;
    // No hay ni red a tiempo ni caché: como último recurso, esperar
    // la respuesta real aunque tarde (mejor tarde que un error feo).
    try { return await fetchPromise; } catch (e2) { throw e2; }
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

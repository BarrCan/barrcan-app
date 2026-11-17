// ═══════════════════════════════════════════════════════════════
// BARRCAN · CUENTAS DE DEPÓSITO (modulos/cuentas_deposito.js)
// v1.0 - 17-nov-2026
// Una sola fuente de verdad para las cuentas que se imprimen en los
// presupuestos y en la pantalla de firma del cliente. Las cuentas viven
// en la tabla barrcan.cuentas_deposito; solo se imprimen las marcadas
// como "activa". Se administran en Configuración (config.html).
// Offline-first: guarda copia en localStorage y la refresca con señal.
// Si nunca se ha podido descargar la lista, usa Mercado Pago W como respaldo.
// ═══════════════════════════════════════════════════════════════
(function () {
  var KEY = 'barrcan_cuentas_deposito_v1';
  var SB_URL = 'https://rmngjtzupukhylxlgcww.supabase.co';
  var SB_KEY = 'sb_publishable_udZ-NNvSLrSaDk2dBRPwMg_IQCZ4N2I';

  var RESPALDO = [{
    alias: 'Mercado Pago W', banco: 'Mercado Pago W (SPEI)',
    titular: 'Mauricio Barrera Espinosa', clabe: '722969010986437805',
    cuenta: null, activa: true, orden: 1
  }];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function leerCache() {
    try {
      var r = JSON.parse(localStorage.getItem(KEY) || 'null');
      return (r && Array.isArray(r.cuentas)) ? r.cuentas : null;
    } catch (e) { return null; }
  }

  // Dígito verificador de la CLABE (pesos 3-7-1 sobre los primeros 17 dígitos).
  function clabeValida(c) {
    c = String(c || '').replace(/\s+/g, '');
    if (!/^\d{18}$/.test(c)) return false;
    var w = [3, 7, 1], suma = 0;
    for (var i = 0; i < 17; i++) suma += (parseInt(c[i], 10) * w[i % 3]) % 10;
    return ((10 - (suma % 10)) % 10) === parseInt(c[17], 10);
  }

  function todas() {
    var c = leerCache();
    return (c || RESPALDO).slice().sort(function (a, b) { return (a.orden || 0) - (b.orden || 0); });
  }

  function activas() {
    return todas().filter(function (c) { return c.activa; });
  }

  function _cliente() {
    try {
      if (typeof window.sb === 'function') { var c = window.sb(); if (c) return c; }
    } catch (e) {}
    if (window.supabase && window.supabase.createClient) {
      return window.supabase.createClient(SB_URL, SB_KEY, { db: { schema: 'barrcan' }, auth: { persistSession: false } });
    }
    return null;
  }

  // Descarga la lista y la guarda. Devuelve la lista (o la que ya había si falla).
  async function refrescar() {
    var cli = _cliente();
    if (!cli) return todas();
    try {
      var r = await cli.from('cuentas_deposito').select('*').eq('eliminado', false).order('orden');
      if (r.error) throw r.error;
      if (r.data) {
        localStorage.setItem(KEY, JSON.stringify({ cuentas: r.data, ts: Date.now() }));
        try { window.dispatchEvent(new CustomEvent('bc-cuentas-actualizadas')); } catch (e) {}
      }
    } catch (e) { console.warn('[BarrCan] No se pudieron refrescar las cuentas de depósito:', e); }
    return todas();
  }

  // Cajas para el documento impreso del presupuesto.
  function htmlDoc() {
    var act = activas();
    if (!act.length) {
      return '<div style="flex:1;border:1px solid #E67E22;border-radius:4px;padding:10px 14px;background:#FFF8F0">'
        + '<div style="font-size:9pt;font-weight:700;color:#E67E22;margin-bottom:4px">Datos de depósito</div>'
        + '<div style="font-size:8.5pt;color:#333">Solicita los datos de depósito por WhatsApp: 56 15 15 84 15</div></div>';
    }
    return act.map(function (c) {
      return '<div style="flex:1;min-width:150px;border:1px solid #ddd;border-radius:4px;padding:10px 14px">'
        + '<div style="font-size:9pt;font-weight:700;color:#1B3A5C;margin-bottom:4px">' + esc(c.banco) + '</div>'
        + '<div style="font-size:8.5pt;color:#333">' + esc(c.titular) + '</div>'
        + (c.cuenta ? '<div style="font-size:8.5pt;color:#333">Cuenta: ' + esc(c.cuenta) + '</div>' : '')
        + '<div style="font-size:8.5pt;color:#333">CLABE: ' + esc(c.clabe) + '</div></div>';
    }).join('');
  }

  // Líneas para la pantalla de firma del cliente (clase .banco de firmar.html).
  function htmlFirmar() {
    var act = activas();
    if (!act.length) return '<div class="banco">Solicita los datos de depósito por WhatsApp: 56 15 15 84 15</div>';
    return act.map(function (c) {
      return '<div class="banco"><b>' + esc(c.banco) + '</b> · ' + esc(c.titular)
        + (c.cuenta ? '<br>Cuenta: ' + esc(c.cuenta) : '')
        + '<br>CLABE: ' + esc(c.clabe) + '</div>';
    }).join('');
  }

  // Texto plano (WhatsApp / mensajes).
  function texto() {
    return activas().map(function (c) {
      return c.banco + ' · ' + c.titular + (c.cuenta ? ' · Cuenta ' + c.cuenta : '') + ' · CLABE ' + c.clabe;
    }).join('\n');
  }

  window.BC_CUENTAS = {
    todas: todas, activas: activas, refrescar: refrescar, clabeValida: clabeValida,
    htmlDoc: htmlDoc, htmlFirmar: htmlFirmar, texto: texto, esc: esc
  };

  // Refresco automático en segundo plano al abrir cualquier módulo que lo cargue.
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('load', function () { setTimeout(refrescar, 400); });
  }
})();

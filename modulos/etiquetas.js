// ══════════════════════════════════════════════════════════════
// BarrCan · ETIQUETAS QR POR BLUETOOTH (compartido)
// VERSION : v2.0   FECHA : 2026-10-05
// v2.0 - Diseñador de etiquetas: la etiqueta se DIBUJA (canvas, 203 dpi =
//   8 px/mm) a partir de una PLANTILLA y se manda a la impresora como una
//   imagen (comando TSPL BITMAP) -- lo que se ve en pantalla es lo que
//   sale. Acentos, ñ y logo funcionan. Plantillas en la tabla
//   etiquetas_plantillas (una "predeterminada" es la que usa Inventario).
//   Dos modos: "rapido" (4 acomodos base + qué datos y tamaño de letra)
//   y "libre" (cada elemento con posición y tamaño propios, en mm).
//   Requiere modulos/qrcode.js cargado antes.
// v1.0 - Impresión por texto TSPL, 60 × 40 mm, AiYin IP-801BT por BLE.
// Uso: await BCEtiquetas.imprimir(piezas, { copias, plantilla })
// ══════════════════════════════════════════════════════════════
(function () {
  var SERVICIOS = ['000018f0-0000-1000-8000-00805f9b34fb','0000ff00-0000-1000-8000-00805f9b34fb','0000fff0-0000-1000-8000-00805f9b34fb',
    '0000ffe0-0000-1000-8000-00805f9b34fb','0000ae30-0000-1000-8000-00805f9b34fb','0000ae00-0000-1000-8000-00805f9b34fb',
    '49535343-fe7d-4ae5-8fa9-9fafd205e455','e7810a71-73ae-499d-8c15-faa9aef0c3f2','0000fee7-0000-1000-8000-00805f9b34fb',
    '0000ff10-0000-1000-8000-00805f9b34fb','0000ffb0-0000-1000-8000-00805f9b34fb'];
  var PX = 8; // puntos por mm a 203 dpi
  var URL_PIEZA = 'https://barrcan.github.io/barrcan-app/inventario.html?p=';
  var LOGO = 'data:image/jpeg;base64,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';
  var DEV = null, CAR = null, PREDETERMINADA = null;

  // ── Conexión Bluetooth (igual que v1.0, probada el 05-oct-2026) ──
  async function hallarCanal(gatt) {
    var ss = await gatt.getPrimaryServices();
    for (var i = 0; i < ss.length; i++) {
      var cs = await ss[i].getCharacteristics();
      for (var j = 0; j < cs.length; j++) if (cs[j].properties.write || cs[j].properties.writeWithoutResponse) return cs[j];
    }
    return null;
  }
  async function conectar() {
    if (!navigator.bluetooth) throw new Error('Este navegador no puede usar Bluetooth. Usa Chrome en Android o en la computadora.');
    if (DEV && CAR && DEV.gatt.connected) return CAR;
    if (DEV && !DEV.gatt.connected) { try { CAR = await hallarCanal(await DEV.gatt.connect()); if (CAR) return CAR; } catch (e) {} }
    DEV = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: SERVICIOS });
    CAR = await hallarCanal(await DEV.gatt.connect());
    if (!CAR) throw new Error('La impresora se conectó, pero no tiene canal para recibir datos.');
    return CAR;
  }
  async function enviarBytes(bytes, alAvanzar) {
    for (var i = 0; i < bytes.length; i += 180) {
      var p = bytes.slice(i, i + 180);
      if (CAR.properties.writeWithoutResponse) await CAR.writeValueWithoutResponse(p); else await CAR.writeValue(p);
      if (alAvanzar) alAvanzar(Math.min(1, (i + 180) / bytes.length));
      await new Promise(function (r) { setTimeout(r, 20); });
    }
  }

  // ── Datos de la pieza ──
  var CAMPOS = {
    clave_cuprum: 'Clave Cuprum', clave_base: 'Clave Alucentro', medida: 'Medida', descripcion: 'Descripción',
    color: 'Color', categoria: 'Categoría', color_cat: 'Color · Categoría', proveedor: 'Proveedor',
    fecha: 'Fecha de etiqueta', folio_obra: 'Obra asignada', marca: 'BARRCAN + fecha'
  };
  function medida(p) {
    if (p.longitud_m) return Number(p.longitud_m).toFixed(2) + ' m';
    var m = String(p.tipo_tramo || '').match(/\(?\s*([0-9]+(?:\.[0-9]+)?)\s*m\)?/i);
    return m ? Number(m[1]).toFixed(2) + ' m' : '';
  }
  function categoria(p) {
    var t = String(p.tipo_tramo || '');
    if (/tramo/i.test(t)) return 'SOBRANTE';
    if (/6\.10/.test(t)) return 'BARRA 6.10';
    return String(p.tipo || '').toUpperCase();
  }
  function hoy() { return new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: '2-digit', year: '2-digit' }); }
  function valor(p, campo) {
    switch (campo) {
      case 'clave_cuprum': return p.clave_cuprum && p.clave_cuprum !== 'N/A' ? String(p.clave_cuprum) : '';
      case 'clave_base': return p.clave_base ? String(p.clave_base) : '';
      case 'medida': return medida(p);
      case 'descripcion': return String(p.descripcion || '').toUpperCase();
      case 'color': return String(p.color || '').toUpperCase();
      case 'categoria': return categoria(p);
      case 'color_cat': return [String(p.color || '').toUpperCase(), categoria(p)].filter(Boolean).join(' · ');
      case 'proveedor': return p.proveedor ? 'PROV: ' + String(p.proveedor).toUpperCase() : '';
      case 'fecha': return hoy();
      case 'folio_obra': return p.folio_obra ? 'OBRA ' + p.folio_obra : '';
      case 'marca': return 'BARRCAN  ' + hoy();
    }
    return '';
  }

  // ── Plantillas base (modo rápido). Medidas en mm sobre 60 × 40. ──
  function T(campo, x, y, w, h, tam, negrita, alinear) { return { tipo: 'campo', campo: campo, x: x, y: y, w: w, h: h, tam: tam, negrita: !!negrita, alinear: alinear || 'left' }; }
  var BASES = {
    perfil: { nombre: 'Perfil completo', elementos: [
      T('clave_cuprum', 2, 1.5, 34, 6, 5.2, true), T('clave_base', 2, 7.6, 34, 3.6, 2.8),
      T('medida', 2, 11.6, 34, 6, 5.2, true), T('descripcion', 2, 18.4, 34, 6.6, 2.7),
      T('color_cat', 2, 25.6, 56, 3.6, 3, true), T('proveedor', 2, 29.8, 36, 3.2, 2.5), T('marca', 2, 34.4, 36, 3.4, 2.6),
      { tipo: 'qr', x: 38, y: 1.5, w: 20.5, h: 20.5 }, { tipo: 'logo', x: 46, y: 29.5, w: 12, h: 9.5 } ] },
    grande: { nombre: 'Grande (para campo)', elementos: [
      T('clave_cuprum', 2, 1.5, 37, 10, 9, true), T('medida', 2, 13, 37, 10, 9, true),
      T('color_cat', 2, 25, 56, 5, 4, true), T('marca', 2, 33.5, 40, 4, 3),
      { tipo: 'qr', x: 40, y: 2, w: 18, h: 18 } ] },
    qr: { nombre: 'QR grande + clave', elementos: [
      { tipo: 'qr', x: 1.5, y: 2, w: 36, h: 36 },
      T('clave_cuprum', 39, 3, 20, 8, 6, true, 'center'), T('medida', 39, 13, 20, 6, 4.4, true, 'center'),
      T('color', 39, 21, 20, 4, 3, false, 'center'), T('categoria', 39, 26, 20, 4, 2.8, false, 'center'), T('fecha', 39, 33, 20, 4, 2.6, false, 'center') ] },
    pieza: { nombre: 'Herraje / pieza', elementos: [
      T('clave_base', 2, 1.5, 36, 6, 5.2, true), T('descripcion', 2, 8.5, 36, 13, 3, false),
      T('color', 2, 23, 36, 4, 3, true), T('proveedor', 2, 28, 56, 3.4, 2.6), T('marca', 2, 34, 40, 3.4, 2.6),
      { tipo: 'qr', x: 40, y: 2, w: 18, h: 18 }, { tipo: 'logo', x: 46, y: 23, w: 12, h: 10 } ] }
  };
  function copiar(o) { return JSON.parse(JSON.stringify(o)); }
  // Convierte lo guardado (rápido o libre) en la lista final de elementos
  function resolver(datos) {
    datos = datos || { modo: 'rapido', base: 'perfil' };
    var r = { ancho: datos.ancho || 60, alto: datos.alto || 40, logoInvertido: datos.logoInvertido !== false };
    if (datos.modo === 'libre') { r.elementos = copiar(datos.elementos || []); return r; }
    var base = BASES[datos.base] || BASES.perfil, escala = datos.escala || 1, ocultos = datos.ocultos || [];
    var fx = r.ancho / 60, fy = r.alto / 40;
    r.elementos = copiar(base.elementos).filter(function (e) {
      if (e.tipo === 'logo') return datos.conLogo !== false;
      return e.tipo !== 'campo' || ocultos.indexOf(e.campo) < 0;
    }).map(function (e) {
      e.x *= fx; e.w *= fx; e.y *= fy; e.h *= fy;
      if (e.tam) e.tam = e.tam * escala * Math.min(fx, fy);
      return e;
    });
    return r;
  }

  // ── Dibujo ──
  var LOGO_IMG = null;
  function cargarLogo() {
    if (LOGO_IMG) return Promise.resolve(LOGO_IMG);
    return new Promise(function (ok) { var i = new Image(); i.onload = function () { LOGO_IMG = i; ok(i); }; i.onerror = function () { ok(null); }; i.src = LOGO; });
  }
  function textoEnCaja(ctx, txt, e) {
    if (!txt) return;
    var px = Math.max(8, Math.round(e.tam * PX)), x = e.x * PX, y = e.y * PX, w = e.w * PX, h = e.h * PX;
    var fuente = function (t) { return (e.negrita ? 'bold ' : '') + t + 'px Arial, Helvetica, sans-serif'; };
    ctx.font = fuente(px);
    var lh = px * 1.12, max = Math.max(1, Math.floor((h + 2) / lh));
    if (max === 1) { while (ctx.measureText(txt).width > w && px > e.tam * PX * 0.55) { px--; ctx.font = fuente(px); } lh = px * 1.12; }
    var palabras = String(txt).split(/\s+/), lineas = [], act = '';
    palabras.forEach(function (p) { var prueba = act ? act + ' ' + p : p; if (ctx.measureText(prueba).width <= w || !act) act = prueba; else { lineas.push(act); act = p; } });
    if (act) lineas.push(act);
    if (lineas.length > max) { lineas = lineas.slice(0, max); var u = lineas[max - 1]; while (u.length > 1 && ctx.measureText(u + '…').width > w) u = u.slice(0, -1); lineas[max - 1] = u + '…'; }
    ctx.fillStyle = '#000'; ctx.textBaseline = 'top';
    lineas.forEach(function (l, i) {
      var mw = ctx.measureText(l).width, tx = e.alinear === 'center' ? x + (w - mw) / 2 : e.alinear === 'right' ? x + w - mw : x;
      ctx.fillText(l, Math.round(tx), Math.round(y + i * lh));
    });
  }
  function dibujarQR(ctx, url, e) {
    if (typeof qrcode !== 'function' || !url) return;
    var q = qrcode(0, 'M'); q.addData(url); q.make();
    var n = q.getModuleCount(), lado = Math.min(e.w, e.h) * PX, m = Math.max(1, Math.floor(lado / n)), real = m * n;
    var ox = Math.round(e.x * PX + (e.w * PX - real) / 2), oy = Math.round(e.y * PX + (e.h * PX - real) / 2);
    ctx.fillStyle = '#000';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) ctx.fillRect(ox + c * m, oy + r * m, m, m);
  }
  function dibujarLogo(ctx, img, e, invertido) {
    if (!img) return;
    var w = e.w * PX, h = e.h * PX, k = Math.min(w / img.width, h / img.height), dw = Math.round(img.width * k), dh = Math.round(img.height * k);
    var t = document.createElement('canvas'); t.width = dw; t.height = dh;
    var tc = t.getContext('2d'); tc.drawImage(img, 0, 0, dw, dh);
    var d = tc.getImageData(0, 0, dw, dh);
    for (var i = 0; i < d.data.length; i += 4) {
      var lum = 0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2];
      var negro = invertido ? lum > 140 : lum < 128;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = negro ? 0 : 255; d.data[i + 3] = 255;
    }
    tc.putImageData(d, 0, 0);
    ctx.drawImage(t, Math.round(e.x * PX + (w - dw) / 2), Math.round(e.y * PX + (h - dh) / 2));
  }
  // Dibuja la etiqueta en el canvas (tamaño real en puntos). Devuelve la plantilla resuelta.
  async function dibujar(canvas, datosPlantilla, pieza) {
    var pl = resolver(datosPlantilla);
    canvas.width = Math.round(pl.ancho * PX); canvas.height = Math.round(pl.alto * PX);
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    var logo = pl.elementos.some(function (e) { return e.tipo === 'logo'; }) ? await cargarLogo() : null;
    pl.elementos.forEach(function (e) {
      if (e.tipo === 'campo') textoEnCaja(ctx, valor(pieza, e.campo), e);
      else if (e.tipo === 'texto') textoEnCaja(ctx, e.texto || '', e);
      else if (e.tipo === 'qr') dibujarQR(ctx, pieza.id ? URL_PIEZA + pieza.id : URL_PIEZA + 'muestra', e);
      else if (e.tipo === 'logo') dibujarLogo(ctx, logo, e, pl.logoInvertido);
      else if (e.tipo === 'linea') { ctx.fillStyle = '#000'; ctx.fillRect(Math.round(e.x * PX), Math.round(e.y * PX), Math.max(1, Math.round(e.w * PX)), Math.max(1, Math.round(e.h * PX))); }
    });
    return pl;
  }
  // Canvas → comando TSPL BITMAP (en TSPL el bit 0 imprime negro, el 1 deja blanco)
  function aTSPL(canvas, pl, copias) {
    var W = canvas.width, H = canvas.height, bpr = Math.ceil(W / 8);
    var img = canvas.getContext('2d').getImageData(0, 0, W, H).data, datos = new Uint8Array(bpr * H).fill(0xFF);
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var i = (y * W + x) * 4;
      if (0.299 * img[i] + 0.587 * img[i + 1] + 0.114 * img[i + 2] < 128) datos[y * bpr + (x >> 3)] &= ~(0x80 >> (x & 7));
    }
    var enc = new TextEncoder();
    var ini = enc.encode('SIZE ' + pl.ancho + ' mm,' + pl.alto + ' mm\r\nGAP 2 mm,0 mm\r\nDIRECTION 1\r\nREFERENCE 0,0\r\nDENSITY 10\r\nCLS\r\nBITMAP 0,0,' + bpr + ',' + H + ',0,');
    var fin = enc.encode('\r\nPRINT 1,' + Math.max(1, Math.min(50, parseInt(copias, 10) || 1)) + '\r\n');
    var out = new Uint8Array(ini.length + datos.length + fin.length);
    out.set(ini, 0); out.set(datos, ini.length); out.set(fin, ini.length + datos.length);
    return out;
  }

  // ── Plantillas guardadas (Supabase) ──
  function cliente() { try { return typeof window.sb === 'function' ? window.sb() : null; } catch (e) { return null; } }
  async function listar() {
    var c = cliente(); if (!c) return [];
    var r = await c.from('etiquetas_plantillas').select('*').order('predeterminada', { ascending: false }).order('nombre');
    return r.data || [];
  }
  async function predeterminada() {
    if (PREDETERMINADA) return PREDETERMINADA;
    try { var l = await listar(); PREDETERMINADA = (l.filter(function (x) { return x.predeterminada; })[0] || {}).datos || null; } catch (e) {}
    return PREDETERMINADA;
  }

  window.BCEtiquetas = {
    version: 'v2.0', CAMPOS: CAMPOS, BASES: BASES, resolver: resolver, dibujar: dibujar, aTSPL: aTSPL,
    listar: listar, predeterminada: predeterminada, olvidarPredeterminada: function () { PREDETERMINADA = null; },
    conectada: function () { return !!(DEV && CAR && DEV.gatt.connected); },
    conectar: conectar,
    imprimir: async function (piezas, opciones) {
      opciones = opciones || {};
      if (!piezas || !piezas.length) return 0;
      var datos = opciones.plantilla || await predeterminada() || { modo: 'rapido', base: 'perfil' };
      await conectar();
      var cv = document.createElement('canvas');
      for (var i = 0; i < piezas.length; i++) {
        var pl = await dibujar(cv, datos, piezas[i]);
        await enviarBytes(aTSPL(cv, pl, opciones.copias), opciones.alAvanzar ? function (f) { opciones.alAvanzar((i + f) / piezas.length); } : null);
        await new Promise(function (r) { setTimeout(r, 400); });
      }
      return piezas.length;
    }
  };
})();

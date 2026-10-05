// ══════════════════════════════════════════════════════════════
// BarrCan · ETIQUETAS QR POR BLUETOOTH (compartido)
// VERSION : v1.0   FECHA : 2026-10-05
// Imprime etiquetas de material directo desde la app en la impresora
// térmica AiYin IP-801BT (Bluetooth BLE, lenguaje TSPL, 203 dpi =
// 8 puntos por mm). Probado el 05-oct-2026 con probar_impresora.html.
// Etiqueta: 60 × 40 mm (480 × 320 puntos). El QR lleva una liga que
// abre Inventario directo en esa pieza:
//   barrcan.github.io/barrcan-app/inventario.html?p=<id>
// La impresora se conecta una vez por sesión; si se desconecta, el
// siguiente envío vuelve a pedirla. Textos sin acentos (las fuentes de
// la impresora no los traen).
// Uso: await BCEtiquetas.imprimir([pieza, pieza, ...])
// ══════════════════════════════════════════════════════════════
(function () {
  var SERVICIOS = ['000018f0-0000-1000-8000-00805f9b34fb','0000ff00-0000-1000-8000-00805f9b34fb','0000fff0-0000-1000-8000-00805f9b34fb',
    '0000ffe0-0000-1000-8000-00805f9b34fb','0000ae30-0000-1000-8000-00805f9b34fb','0000ae00-0000-1000-8000-00805f9b34fb',
    '49535343-fe7d-4ae5-8fa9-9fafd205e455','e7810a71-73ae-499d-8c15-faa9aef0c3f2','0000fee7-0000-1000-8000-00805f9b34fb',
    '0000ff10-0000-1000-8000-00805f9b34fb','0000ffb0-0000-1000-8000-00805f9b34fb'];
  var ANCHO_MM = 60, ALTO_MM = 40, PUNTOS_MM = 8;
  var URL_PIEZA = 'https://barrcan.github.io/barrcan-app/inventario.html?p=';
  var DEV = null, CAR = null;

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
    if (DEV && !DEV.gatt.connected) {
      try { CAR = await hallarCanal(await DEV.gatt.connect()); if (CAR) return CAR; } catch (e) {}
    }
    DEV = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: SERVICIOS });
    CAR = await hallarCanal(await DEV.gatt.connect());
    if (!CAR) throw new Error('La impresora se conectó, pero no tiene canal para recibir datos.');
    return CAR;
  }
  async function enviar(texto) {
    var datos = new TextEncoder().encode(texto);
    for (var i = 0; i < datos.length; i += 180) {
      var p = datos.slice(i, i + 180);
      if (CAR.properties.writeWithoutResponse) await CAR.writeValueWithoutResponse(p); else await CAR.writeValue(p);
      await new Promise(function (r) { setTimeout(r, 25); });
    }
  }
  function ascii(s) {
    return String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/["\\]/g, "'").replace(/[·•]/g, '-').replace(/[^\x20-\x7E]/g, '').trim();
  }
  function lineas(s, max, cuantas) {
    var palabras = ascii(s).toUpperCase().split(/\s+/), out = [], act = '';
    palabras.forEach(function (w) {
      if (!w) return;
      if ((act + ' ' + w).trim().length <= max) act = (act + ' ' + w).trim();
      else { if (act) out.push(act); act = w.slice(0, max); }
    });
    if (act) out.push(act);
    if (out.length > cuantas) { out = out.slice(0, cuantas); out[cuantas - 1] = out[cuantas - 1].slice(0, max - 1) + '.'; }
    return out;
  }
  function medida(p) {
    if (p.longitud_m) return Number(p.longitud_m).toFixed(2) + ' m';
    var m = String(p.tipo_tramo || '').match(/\(?\s*([0-9]+(?:\.[0-9]+)?)\s*m\)?/i);
    if (m) return Number(m[1]).toFixed(2) + ' m';
    return '';
  }
  function categoria(p) {
    var t = String(p.tipo_tramo || '');
    if (/tramo/i.test(t)) return 'SOBRANTE';
    if (/6\.10/.test(t)) return 'BARRA 6.10';
    return ascii(p.tipo || '').toUpperCase();
  }
  function fechaHoy() {
    return new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: '2-digit', year: '2-digit' });
  }
  function texto(x, y, fuente, valor) { return 'TEXT ' + x + ',' + y + ',"' + fuente + '",0,1,1,"' + ascii(valor) + '"\r\n'; }

  // 480 × 320 puntos. Columna izquierda: x 16..292. QR arriba a la derecha.
  function tspl(p, copias) {
    var t = 'SIZE ' + ANCHO_MM + ' mm,' + ALTO_MM + ' mm\r\nGAP 2 mm,0 mm\r\nDIRECTION 1\r\nREFERENCE 0,0\r\nDENSITY 10\r\nCLS\r\n';
    t += texto(16, 14, '4', String(p.clave_base || '-').slice(0, 11));
    if (p.clave_cuprum && p.clave_cuprum !== 'N/A') t += texto(16, 54, '2', ('CUPRUM ' + p.clave_cuprum).slice(0, 23));
    var med = medida(p);
    if (med) t += texto(16, 84, '4', med);
    lineas(p.descripcion || '', 23, 2).forEach(function (l, i) { t += texto(16, 126 + i * 26, '2', l); });
    var pie = [ascii(p.color || '').toUpperCase(), categoria(p)].filter(Boolean).join(' - ');
    t += texto(16, 196, '3', pie.slice(0, 28));
    if (p.proveedor) t += texto(16, 232, '2', ('PROV: ' + ascii(p.proveedor).toUpperCase()).slice(0, 38));
    t += texto(16, 288, '2', 'BARRCAN  ' + fechaHoy());
    if (p.id) t += 'QRCODE ' + (ANCHO_MM * PUNTOS_MM - 164 - 14) + ',14,M,4,A,0,"' + URL_PIEZA + p.id + '"\r\n';
    t += 'PRINT 1,' + Math.max(1, Math.min(50, parseInt(copias, 10) || 1)) + '\r\n';
    return t;
  }

  window.BCEtiquetas = {
    version: 'v1.0',
    conectada: function () { return !!(DEV && CAR && DEV.gatt.connected); },
    conectar: conectar,
    tspl: tspl,
    imprimir: async function (piezas, opciones) {
      opciones = opciones || {};
      if (!piezas || !piezas.length) return 0;
      await conectar();
      for (var i = 0; i < piezas.length; i++) {
        await enviar(tspl(piezas[i], opciones.copias));
        await new Promise(function (r) { setTimeout(r, 350); }); // deja respirar a la impresora entre etiquetas
      }
      return piezas.length;
    }
  };
})();

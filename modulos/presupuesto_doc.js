// ══════════════════════════════════════════════════════════════
// BarrCan · DOCUMENTO OFICIAL DE PRESUPUESTO (compartido)
// VERSION : v1.2   FECHA : 2026-10-06
// v1.1 - Correo de facturación corregido a ventas@barrcan.com.mx.
// v1.2 - Si el cliente tiene empresa en su ficha: "Cliente: EMPRESA" y
//   "En atención a: Arq. X" (opciones.empresa / opciones.atencion).
// Un solo lugar para el formato acordado (encabezado oficial, partidas
// con cantidad × precio unitario, diagramas de referencia, condiciones
// de venta, política de pagos con cuentas BBVA/Banorte, almacenamiento,
// tiempos y firmas). Lo usan Historial y el cotizador de Baños -- un
// cambio aquí aplica a ambos. Sacado tal cual del cotizador de Baños,
// con dos arreglos: el botón Imprimir espera a que carguen logo y
// diagramas (antes salían en blanco), y los importes ya no llevan
// doble signo de pesos ("$$").
// Uso: BCDoc.generar(items, folio, cliente, direccion, fechaDate, {total})
// ══════════════════════════════════════════════════════════════
(function () {
  function esc(s) { if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function fmt(n) { return Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

var _LOGO_WORDMARK_URL = 'https://barrcan.github.io/barrcan-app/assets/logo-oficial.jpg';
var _LOGO_WORDMARK_B64 = 'data:image/jpeg;base64,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';

// Este módulo nunca generaba un documento imprimible para el cliente
// -- solo guardaba y mostraba un toast. Se agrega el mismo formato
// que ya usan Nacional/Servicios/Eurovent/Español.
function snHeaderOficial(tituloDoc, folioDoc) {
  return '<div style="background:#1B3A5C;padding:14px 10px;text-align:center">'
    + '<img src="' + _LOGO_WORDMARK_URL + '" onerror="this.onerror=null;this.src=\'' + _LOGO_WORDMARK_B64 + '\';" style="max-width:280px;width:75%;height:auto;display:inline-block">'
    + '</div>'
    + '<div style="text-align:center;padding:10px 16px 8px;font-size:8pt;color:#1B3A5C;line-height:1.5">'
    + 'PRIV. SANTA CRUZ No.23 COL. SAN SIM\u00d3N TICUMAC CP. 03660 &nbsp;BENITO JU\u00c1REZ, M\u00c9XICO, D.F.<br>'
    + 'TEL: 56-15-15-84-15 &nbsp;&bull;&nbsp; WWW.BarrCan.com.mx &nbsp;&bull;&nbsp; ventas@barrcan.com.mx'
    + '</div>'
    + '<div style="text-align:center;color:#C8923A;font-size:10px;letter-spacing:2px;padding:2px 0 10px;overflow:hidden;white-space:nowrap">'
    + Array(40).fill('&bull;').join(' ')
    + '</div>'
    + '<div style="text-align:center;padding-bottom:12px;border-bottom:2.5px solid #1B3A5C;margin-bottom:14px">'
    + '<div style="font-size:13pt;font-weight:900;color:#1B3A5C;text-transform:uppercase;letter-spacing:.5px">' + esc(tituloDoc) + '</div>'
    + '<div style="font-size:12pt;font-weight:900;color:#C8923A;font-family:monospace;margin-top:2px">' + esc(folioDoc || '') + '</div>'
    + '</div>';
}

// ── Diagrama técnico de referencia (Cancel Corredizo) ───────────
// Fotos reales subidas por Mau a GitHub: Corre-6mm-Tem.jpg (recta,
// dos hojas) y Esc-6mm-Tem.jpg (escuadra, fijo-corredizo-fijo).
// Se anexan al documento impreso con las medidas REALES de la pieza
// cotizada, igual que la muestra de presupuesto del proyecto.
var _DIAG_CORREDIZO_URL  = 'https://barrcan.github.io/barrcan-app/assets/Corre-6mm-Tem.jpg';
var _DIAG_ESCUADRA_URL   = 'https://barrcan.github.io/barrcan-app/assets/Esc-6mm-Tem.jpg';

function snDiagramaCorredizo(resultado) {
  // v3.6: también la Escuadra de 2 muros (tipo 'escuadra', medidas L × P)
  if (!resultado || (resultado.tipo !== 'corredizo' && resultado.tipo !== 'escuadra')) return '';
  var esEscuadra = resultado.tipo === 'escuadra' || resultado.config === 'escuadra';
  var url = esEscuadra ? _DIAG_ESCUADRA_URL : _DIAG_CORREDIZO_URL;
  var medidas = resultado.tipo === 'escuadra'
    ? (resultado.L + ' \u00d7 ' + resultado.P + ' mm &middot; alto ' + resultado.H + ' mm')
    : esEscuadra
    ? (resultado.L + ' \u00d7 ' + resultado.L2 + ' mm &middot; alto ' + resultado.H + ' mm')
    : (resultado.L + ' mm &middot; alto ' + resultado.H + ' mm');
  return '<div style="display:flex;gap:10px;align-items:center;margin-top:6px;padding-left:4px">'
    + '<img src="' + url + '" onerror="this.style.display=\'none\'" style="width:72px;height:auto;flex-shrink:0;border:1px solid #ddd;border-radius:4px;background:#fafafa" alt="Diagrama de referencia">'
    + '<div style="font-size:9pt;color:#666">' + medidas + '</div>'
    + '</div>';
}

function snGenerarDocumentoPresupuesto(items, folio, cliente, dir, fecha, opciones) {
  opciones = opciones || {};
  var fechaStr = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  var total = opciones.total != null ? opciones.total : items.reduce(function(a, it){ return a + (parseFloat(it.precio) || 0); }, 0);
  var lista = items.map(function(it, idx) {
    var cant = it.cantidad || 1;
    var detalle = cant > 1 ? ' <span style="color:#888;font-size:9pt">(' + cant + ' pzas \u00d7 $' + fmt(it.precioUnitario != null ? it.precioUnitario : (it.precio / cant)) + ')</span>' : '';
    // Diagrama técnico de referencia para piezas del sistema Corredizo
    // (fotos reales subidas por Mau a /assets/ -- Corre-6mm-Tem.jpg para
    // recta, Esc-6mm-Tem.jpg para escuadra) con las medidas reales de
    // ESTA pieza, igual que la muestra de presupuesto del proyecto.
    var diagrama = snDiagramaCorredizo(it.resultado);
    return '<div style="padding:6px 0;border-bottom:1px solid #eee;font-size:11pt">'
      + '<div style="display:flex;justify-content:space-between">'
      + '<span>' + (idx + 1) + '. ' + esc(it.label) + detalle + '</span>'
      + '<span style="font-weight:700;white-space:nowrap;padding-left:12px">$' + fmt(it.precio) + '</span></div>'
      + diagrama
      + '</div>';
  }).join('');
  return '<!DOCTYPE html><html lang=es><head><meta charset=UTF-8><meta name=viewport content=width=device-width>'
    + '<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:10pt;color:#1B3A5C;background:#fff}'
    + '.pg{max-width:620px;margin:0 auto;padding:0 0 80px}.pg-body{padding:16px 22px}'
    + '.page-break{page-break-before:always;padding-top:28px}'
    + 'h2{font-size:10.5pt;font-weight:700;color:#1B3A5C;border-bottom:2px solid #C8923A;padding-bottom:3px;margin:18px 0 10px;text-transform:uppercase;letter-spacing:.5px}'
    + 'table{width:100%;border-collapse:collapse}th{background:#1B3A5C;color:#fff;padding:7px 10px;font-size:9pt;font-weight:700}td{padding:6px 10px;font-size:9pt;border:1px solid #ddd}'
    + '.barra{position:fixed;bottom:0;left:0;right:0;background:#1B3A5C;padding:8px 14px;display:flex;gap:8px;justify-content:center;z-index:999}'
    + '.bp{padding:9px 20px;background:#C8923A;color:#fff;border:none;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer}'
    + '.bc{padding:9px 12px;background:rgba(255,255,255,.15);color:#fff;border:none;border-radius:7px;font-size:12px;cursor:pointer}'
    + '@media print{.barra{display:none!important}}</style></head><body>'
    + '<script>function imprimirListo(btn){if(btn){btn.disabled=true;btn.style.opacity=0.5;}var imgs=Array.prototype.slice.call(document.images);var esperas=imgs.map(function(im){return im.decode?im.decode().catch(function(){}):Promise.resolve();});if(document.fonts&&document.fonts.ready){esperas.push(document.fonts.ready);}var hecho=false;function lanzar(){if(hecho)return;hecho=true;requestAnimationFrame(function(){requestAnimationFrame(function(){setTimeout(function(){if(btn){btn.disabled=false;btn.style.opacity=1;}window.print();},500);});});}Promise.all(esperas).then(lanzar,lanzar);setTimeout(lanzar,8000);}<\/script>'
    + '<div class=barra><button class=bp onclick="imprimirListo(this)">Imprimir / PDF</button><button class=bc onclick="window.close()">Cerrar</button></div>'
    + '<div class=pg>'
    + snHeaderOficial('Presupuesto - Contrato', folio)
    + '<div class=pg-body>'
    + '<div style="text-align:right;font-size:10pt;color:#666;margin-bottom:10px">' + fechaStr + '</div>'
    + '<div style="font-size:11pt;margin-bottom:2px"><strong>Cliente:</strong> ' + esc(opciones.empresa || cliente) + '</div>'
    + (opciones.empresa ? '<div style="font-size:10.5pt;margin-bottom:2px">En atenci\u00f3n a: <strong>' + esc(opciones.atencion || cliente) + '</strong></div>' : '')
    + (dir ? '<div style="font-size:10pt;color:#666;margin-bottom:14px">' + esc(dir) + '</div>' : '<div style="margin-bottom:14px"></div>')
    + lista
    + '<div style="display:flex;justify-content:flex-end;padding-top:12px;font-size:14pt;font-weight:900;color:#1B3A5C">$' + fmt(total) + '</div>'
    + '<div style="margin-top:24px;font-size:9pt;text-align:center;color:#1B3A5C;background:#F7F5F0;padding:10px;border-radius:6px">'
    + 'El presente presupuesto contempla los trabajos antes descritos, cualquier otro trabajo adicional se cotizar\u00e1. Estos precios est\u00e1n sujetos a cambios sin previo aviso.'
    + '</div>'

    // ═══ PÁGINA 2: CONDICIONES DE VENTA ═══
    + '<div class="page-break">'
    + '<h2>1. Condiciones de venta</h2>'
    + '<ol style="padding-left:18px;font-size:9pt;line-height:1.8;color:#222">'
    + '<li><strong>Vigencia:</strong> Este presupuesto tiene una vigencia de <strong>10 d\u00edas h\u00e1biles</strong> a partir de su fecha de emisi\u00f3n. Transcurrido ese plazo, los precios podr\u00e1n modificarse sin previo aviso. En caso de requerir factura electr\u00f3nica (CFDI), el IVA se desglosar\u00e1 sobre el importe acordado.</li>'
    + '<li><strong>Vanos descuadrados:</strong> No se incluyen perfiles de ajuste por vanos que presenten falta de plomo, nivel o escuadra. Si se detectan durante la visita de instalaci\u00f3n, se cotizar\u00e1n por separado.</li>'
    + '<li><strong>Limpieza:</strong> No se incluye limpieza fina posterior a la instalaci\u00f3n. El retiro de residuos propios del proceso de instalaci\u00f3n s\u00ed est\u00e1 comprendido.</li>'
    + '<li><strong>Tolerancias de fabricaci\u00f3n:</strong> La tolerancia est\u00e1ndar es de \u00b15 mm en todas las dimensiones, conforme a las pr\u00e1cticas del sector.</li>'
    + '<li><strong>Condici\u00f3n de los vanos:</strong> El estado de los vanos al momento de la instalaci\u00f3n es responsabilidad exclusiva del cliente. BarrCan no responde por deficiencias estructurales preexistentes que dificulten o impidan la correcta instalaci\u00f3n.</li>'
    + '<li><strong>Cambios y modificaciones:</strong> Este presupuesto quedar\u00e1 sin efecto ante cualquier cambio en modulaci\u00f3n, dimensiones, cantidades, colores, materiales o especificaciones de los elementos descritos. Toda modificaci\u00f3n requerir\u00e1 la emisi\u00f3n de un nuevo presupuesto actualizado.</li>'
    + '<li><strong>Trabajos con material existente:</strong> La manipulaci\u00f3n de material preexistente (vidrios, espejos, perfiles, herrajes) se realiza sin responsabilidad por da\u00f1os accidentales. En caso de rotura o da\u00f1o, BarrCan no asumir\u00e1 el costo de reposici\u00f3n; el trabajo de restauraci\u00f3n se cotizar\u00e1 por separado.</li>'
    + '<li><strong>Almacenamiento de material:</strong> El material retirado que deba resguardarse para uso posterior tendr\u00e1 un periodo sin costo de hasta <strong>5 d\u00edas h\u00e1biles</strong>. A partir del quinto d\u00eda se aplicar\u00e1 un cargo de <strong>$80 MXN por d\u00eda natural</strong>. Consulte la Secci\u00f3n 3 para condiciones completas.</li>'
    + '<li><strong>Aceptaci\u00f3n por dep\u00f3sito:</strong> El dep\u00f3sito del anticipo implica la aceptaci\u00f3n plena de todas las condiciones descritas en este presupuesto. (En casos con visita de asesoramiento previo, se requerir\u00e1 confirmaci\u00f3n expresa del cliente, dado que el costo de dicha visita se acredita al anticipo inicial.)</li>'
    + '<li><strong>Pol\u00edtica de reembolso:</strong> En caso de cancelaci\u00f3n del proyecto se retendr\u00e1 el <strong>25% del costo total</strong> por gastos administrativos y asesoramiento. Si la cancelaci\u00f3n ocurre antes de iniciar fabricaci\u00f3n, se devolver\u00e1 el material adquirido y la diferencia econ\u00f3mica, descontando el 25% y el costo de materiales comprados. Si la fabricaci\u00f3n ya inici\u00f3, no procede reembolso en efectivo; se entregar\u00e1 el material en el estado en que se encuentre como finiquito total.</li>'
    + '</ol>'
    + '<h2>Trabajos no comprendidos en este presupuesto</h2>'
    + '<ul style="padding-left:18px;font-size:9pt;line-height:2;color:#222">'
    + '<li><strong>NO INCLUYE</strong> ning\u00fan trabajo de <strong>ALBA\u00d1ILER\u00cdA</strong> (muros, castillos, plantillas, resanes, etc.)</li>'
    + '<li><strong>NO INCLUYE</strong> ning\u00fan trabajo de <strong>HERRER\u00cdA</strong> (estructuras met\u00e1licas, barandales, rejas u otros similares)</li>'
    + '<li><strong>NO INCLUYE</strong> ning\u00fan trabajo de <strong>CARPINTER\u00cdA</strong> (marcos, puertas de madera, muebles o similares)</li>'
    + '<li><strong>NO INCLUYE</strong> ning\u00fan trabajo de <strong>ELECTRICIDAD</strong> (cableado, contactos, iluminaci\u00f3n, etc.)</li>'
    + '</ul>'
    + '</div>'

    // ═══ PÁGINA 3: PAGOS + DATOS BANCARIOS + ALMACENAMIENTO ═══
    + '<div class="page-break">'
    + '<h2>2. Pol\u00edtica de pagos</h2>'
    + '<p style="font-size:9pt;color:#333;margin-bottom:10px">Al aprobar formalmente el presupuesto, el cliente acepta las siguientes condiciones de pago:</p>'
    + '<table style="margin-bottom:12px"><thead><tr><th>Concepto</th><th style="text-align:center;width:100px">Porcentaje</th><th>Momento de pago</th><th style="text-align:right;width:110px">Monto</th></tr></thead><tbody>'
    + '<tr><td>Anticipo inicial</td><td style="text-align:center">50 %</td><td>Al aprobar y firmar el presupuesto</td><td style="text-align:right;font-weight:700">$&nbsp;' + fmt(total * 0.50) + '</td></tr>'
    + '<tr style="background:#f5f7fa"><td>Segundo pago</td><td style="text-align:center">35 %</td><td>Al confirmar fecha de entrega e instalaci\u00f3n</td><td style="text-align:right;font-weight:700">$&nbsp;' + fmt(total * 0.35) + '</td></tr>'
    + '<tr style="background:#1B3A5C;color:white"><td style="color:white;font-weight:700;border-color:#1B3A5C">Liquidaci\u00f3n final</td><td style="color:white;text-align:center;border-color:#1B3A5C">15 %</td><td style="color:rgba(255,255,255,.85);border-color:#1B3A5C">A la entrega y conclusi\u00f3n total del trabajo</td><td style="color:#F1C40F;text-align:right;font-weight:700;border-color:#1B3A5C">$&nbsp;' + fmt(total * 0.15) + '</td></tr>'
    + '</tbody></table>'
    + '<div style="display:flex;gap:16px;margin-bottom:12px">'
    + '<div style="flex:1;border:1px solid #ddd;border-radius:4px;padding:10px 14px">'
    + '<div style="font-size:9pt;font-weight:700;color:#1B3A5C;margin-bottom:4px">Banorte</div>'
    + '<div style="font-size:8.5pt;color:#333">Mauricio Barrera Espinosa</div>'
    + '<div style="font-size:8.5pt;color:#333">Cuenta: 0672530766</div>'
    + '<div style="font-size:8.5pt;color:#333">CLABE: 072180006725307668</div></div>'
    + '<div style="flex:1;border:1px solid #ddd;border-radius:4px;padding:10px 14px">'
    + '<div style="font-size:9pt;font-weight:700;color:#1B3A5C;margin-bottom:4px">BBVA</div>'
    + '<div style="font-size:8.5pt;color:#333">Mauricio Barrera Espinosa</div>'
    + '<div style="font-size:8.5pt;color:#333">Cuenta: 1512081906</div>'
    + '<div style="font-size:8.5pt;color:#333">CLABE: 012180015120819061</div></div>'
    + '<div style="flex:1;border:1px solid #ddd;border-radius:4px;padding:10px 14px">'
    + '<div style="font-size:9pt;font-weight:700;color:#1B3A5C;margin-bottom:4px">Titular</div>'
    + '<div style="font-size:8.5pt;color:#333">Mauricio Barrera Espinosa</div>'
    + '<div style="font-size:8.5pt;color:#333">RFC: BAEM790610K90</div>'
    + '<div style="font-size:8pt;color:#888;margin-top:4px;font-style:italic">Factura: ventas@barrcan.com.mx</div></div>'
    + '</div>'
    + '<div style="border:1.5px solid #E67E22;border-radius:4px;padding:10px 12px;margin-bottom:14px;background:#FFF8F0">'
    + '<div style="font-size:9pt;font-weight:700;color:#E67E22;margin-bottom:4px">IMPORTANTE \u2014 Segundo pago (35%)</div>'
    + '<div style="font-size:8.5pt;color:#555;font-style:italic;line-height:1.6">Este pago deber\u00e1 efectuarse en la fecha acordada o a m\u00e1s tardar el mismo d\u00eda en que se defina la agenda de instalaci\u00f3n. Si BarrCan no recibe dicho pago en el plazo indicado, la fecha de instalaci\u00f3n agendada quedar\u00e1 autom\u00e1ticamente liberada y deber\u00e1 reagendarse conforme a la disponibilidad del taller. Esta cancelaci\u00f3n no generar\u00e1 penalizaci\u00f3n ni cargo adicional de parte de BarrCan.</div>'
    + '</div>'
    + '<h2>3. Almacenamiento y disposici\u00f3n de material</h2>'
    + '<table style="margin-bottom:14px;font-size:8.5pt"><tbody>'
    + '<tr><td style="font-weight:700;background:#f5f7fa;width:36%">Periodo sin costo y notificaci\u00f3n</td><td>El material tendr\u00e1 un periodo de almacenamiento sin costo de hasta <strong>5 d\u00edas h\u00e1biles</strong>. Al cuarto d\u00eda h\u00e1bil, BarrCan notificar\u00e1 al cliente por WhatsApp o correo electr\u00f3nico para que considere el retiro antes de que inicie el periodo de cobro.</td></tr>'
    + '<tr><td style="font-weight:700;background:#f5f7fa">Cargo por almacenamiento</td><td>A partir del quinto d\u00eda h\u00e1bil, se aplicar\u00e1 un cargo de <strong>$80 MXN por d\u00eda natural</strong> hasta que el material sea retirado o cedido formalmente.</td></tr>'
    + '<tr><td style="font-weight:700;background:#f5f7fa">Flete de entrega (CDMX)</td><td>Si el cliente requiere que BarrCan entregue el material en su domicilio dentro de la Ciudad de M\u00e9xico: <strong>$800 MXN</strong> carga ligera / <strong>$1,000 MXN</strong> volumen medio / <strong>$1,800 MXN</strong> volumen alto. Se liquida antes de coordinar la entrega.</td></tr>'
    + '<tr><td style="font-weight:700;background:#f5f7fa">Flete for\u00e1neo</td><td>Para entregas fuera de la Ciudad de M\u00e9xico, el costo se calcular\u00e1 conforme a la distancia. BarrCan notificar\u00e1 el monto al cliente para su aprobaci\u00f3n antes de confirmar la log\u00edstica.</td></tr>'
    + '<tr><td style="font-weight:700;background:#f5f7fa">Cesi\u00f3n de material a BarrCan</td><td>Si el cliente cede el material a BarrCan, se aplicar\u00e1 un cargo \u00fanico de <strong>$1,000 MXN</strong> por concepto de manejo, retiro y disposici\u00f3n, el cual deber\u00e1 cubrirse de forma anticipada.</td></tr>'
    + '</tbody></table>'
    + '<h2>4. Tiempo de entrega e instalaci\u00f3n</h2>'
    + '<div style="font-size:9.5pt;color:#333;padding:10px 14px;background:#EAF4FF;border-left:4px solid #1B3A5C;border-radius:0 4px 4px 0;margin-bottom:18px;line-height:1.7">'
    + 'El tiempo estimado de fabricaci\u00f3n e instalaci\u00f3n es de <strong>5 a 7 d\u00edas h\u00e1biles</strong> contados a partir de la recepci\u00f3n del anticipo del 50 %. BarrCan notificar\u00e1 con anticipaci\u00f3n si la carga de trabajo no permitiera cumplir con dicho plazo.'
    + '</div>'
    + '<table style="width:100%;margin-top:24px"><tr>'
    + '<td style="width:44%;padding:50px 12px 8px;border-top:1.5px solid #999;font-size:9pt;color:#555;text-align:center">Firma y nombre del cliente<br>Fecha: ___________________</td>'
    + '<td style="width:12%"></td>'
    + '<td style="width:44%;padding:50px 12px 8px;border-top:1.5px solid #999;font-size:9pt;color:#555;text-align:center">Sello y firma BarrCan<br><span style="font-family:\'Courier New\',monospace;font-size:8pt;color:#1B3A5C">' + esc(folio) + '</span></td>'
    + '</tr></table>'
    + '<div style="font-size:7.5pt;color:#aaa;text-align:center;margin-top:16px;border-top:1px solid #eee;padding-top:8px">'
    + 'El presente presupuesto contempla los trabajos antes descritos. Cualquier trabajo adicional se cotizar\u00e1 por separado. Estos precios est\u00e1n sujetos a cambios sin previo aviso. &nbsp;\u00b7&nbsp; ' + esc(folio)
    + '</div>'
    + '</div>'
    + '</div></div></body></html>';
}


  // v1.2: datos de empresa desde la ficha del cliente. Se busca por nombre
  // (sin títulos ni acentos) y, si no, por el número de cliente del folio.
  function normNombre(n) { return String(n || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/^(arq|ing|lic|sr|sra|srita|dr|dra)\.?\s+/, '').replace(/\s+/g, ' ').trim(); }
  async function datosCliente(folio, cliente) {
    try {
      var c = typeof window.sb === 'function' ? window.sb() : null;
      if (!c) return {};
      var r = await c.from('clientes').select('nombre,num_cliente,empresa').limit(1000);
      var lista = r.data || [], nom = normNombre(cliente), num = String(folio || '').split('-')[3] || '';
      var f = lista.filter(function (x) { return nom && normNombre(x.nombre) === nom; })[0]
           || (num ? lista.filter(function (x) { return String(x.num_cliente || '') === num; })[0] : null);
      if (!f || !String(f.empresa || '').trim()) return {};
      return { empresa: String(f.empresa).trim(), atencion: f.nombre };
    } catch (e) { return {}; }
  }
  window.BCDoc = { version: 'v1.2', generar: snGenerarDocumentoPresupuesto, diagrama: snDiagramaCorredizo, datosCliente: datosCliente };
})();

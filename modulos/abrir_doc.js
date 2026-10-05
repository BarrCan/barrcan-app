// ══════════════════════════════════════════════════════════════
// BarrCan · ABRIR DOCUMENTOS CON SU FOLIO (compartido)
// VERSION : v1.0   FECHA : 2026-10-04
// Antes, presupuestos, recibos, reportes y entregas se abrían como
// window.open('') + document.write: la barra decía "about:blank" y el
// PDF se guardaba sin nombre útil. Esta pieza intercepta SOLO esas
// aperturas en blanco y las manda a ver_doc.html?ref=<FOLIO>, y pone el
// folio como título (el PDF se guarda con ese nombre). No cambia la
// lógica de cada módulo: sigue funcionando document.write/close/open,
// close(), print() y onload. La ventana se abre en el mismo instante que
// antes (no la bloquea el celular). Si el documento es demasiado grande
// para pasarlo (fotos), se escribe directo en la ventana nueva.
// ══════════════════════════════════════════════════════════════
(function () {
  if (window.__bcAbrirDoc) return; window.__bcAbrirDoc = true;
  var abrirOriginal = window.open.bind(window);
  var VISOR = new URL('ver_doc.html', location.href).href;
  var RE_FOLIO = /\b(?:CACN|STAN|SERV|ENT|VIS|RB|GAR|ORD|INS|MOS|ADI|CUB|ESP|EUR|NAC|EC)-[A-Z0-9]+(?:-[A-Z0-9]+)*/;

  function limpiarViejos() {
    try {
      var ahora = Date.now();
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var k = localStorage.key(i);
        if (k && k.indexOf('barrcan_doc_') === 0) {
          var t = 0; try { t = JSON.parse(localStorage.getItem(k)).t || 0; } catch (e) {}
          if (ahora - t > 3600000) localStorage.removeItem(k);
        }
      }
    } catch (e) {}
  }
  function refDe(html) {
    var t = html.match(/<title>([^<]{2,80})<\/title>/i);
    var txt = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
    var m = txt.match(RE_FOLIO);
    if (m) return m[0];
    return t ? t[1].replace(/\s*[·|-]\s*BarrCan.*$/i, '').trim() : 'Documento BarrCan';
  }
  function conTitulo(html, ref, autoImprimir) {
    var titulo = '<title>' + ref.replace(/</g, '') + ' · BarrCan</title>';
    if (/<title>[\s\S]*?<\/title>/i.test(html)) html = html.replace(/<title>[\s\S]*?<\/title>/i, titulo);
    else if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, function (h) { return h + titulo; });
    else html = titulo + html;
    if (autoImprimir) {
      var s = '<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},700);});<\/script>';
      html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, s + '</body>') : html + s;
    }
    return html;
  }

  window.open = function (url, target, feats) {
    if (url && url !== 'about:blank') return abrirOriginal(url, target, feats);
    limpiarViejos();
    var k = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    var real = abrirOriginal(VISOR + '?k=' + k, target || '_blank', feats);
    if (!real) return null;
    var buf = [], entregado = false, cerrado = false, autoImprimir = false, temporizador = null;

    function entregar() {
      if (cerrado) return;
      var html = buf.join('');
      if (!html) return;
      var ref = refDe(html);
      var final = conTitulo(html, ref, autoImprimir);
      entregado = true;
      try {
        localStorage.setItem('barrcan_doc_' + k, JSON.stringify({ html: final, ref: ref, t: Date.now() }));
      } catch (eCuota) {
        // Documento demasiado grande para pasarlo: se escribe directo
        // (misma página del visor, mismo sitio) -- conserva título y URL ?k=
        try { real.document.open(); real.document.write(final); real.document.close(); } catch (e2) {}
      }
    }
    function programar() {
      // Algunos módulos escriben sin llamar close(): si ya hay un documento
      // completo, se entrega solo. Un aviso suelto ("Generando recibo…") no.
      clearTimeout(temporizador);
      temporizador = setTimeout(function () { if (/<\/html>|<\/body>/i.test(buf.join(''))) entregar(); }, 600);
    }
    var falsa = {
      document: {
        write: function () { buf.push(Array.prototype.join.call(arguments, '')); programar(); },
        writeln: function () { buf.push(Array.prototype.join.call(arguments, '') + '\n'); programar(); },
        open: function () { buf = []; entregado = false; return falsa.document; },
        close: function () { clearTimeout(temporizador); entregar(); }
      },
      focus: function () { try { real.focus(); } catch (e) {} },
      print: function () { autoImprimir = true; if (entregado) entregar(); },
      close: function () { cerrado = true; try { real.close(); } catch (e) {} },
      get closed() { try { return real.closed; } catch (e) { return true; } },
      get location() { return real.location; },
      set onload(fn) { autoImprimir = true; if (entregado) entregar(); },
      get onload() { return null; }
    };
    return falsa;
  };
})();

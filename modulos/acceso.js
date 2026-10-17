// ══════════════════════════════════════════════════════════════
// BarrCan · CANDADO DE ACCESO A LOS MÓDULOS (compartido)
// VERSION : v1.0   FECHA : 2026-10-14
// Antes, el PIN solo protegía el portal (barrcan_brain.html); cualquier
// módulo se abría directo por su liga (pagos.html, historial.html...)
// sin pedir nada. Ahora cada módulo interno revisa que haya una sesión
// del día (la que crea el portal al meter el PIN o la huella). Si no
// la hay, no deja ver ni cargar nada y manda al portal para iniciar
// sesión; al entrar, regresa al módulo que se quería abrir.
// NO se incluye en las páginas públicas (firmar, garantía pública,
// encuesta pública, ver_reporte, ver_doc) ni en el portal.
// OJO: esto frena a quien llega por una liga; NO sustituye la seguridad
// de la base de datos (ver plan con Supabase Auth).
// ══════════════════════════════════════════════════════════════
(function () {
  if (window.__bcAcceso) return; window.__bcAcceso = true;
  function hoy() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  var ok = false;
  try {
    var u = JSON.parse(localStorage.getItem('barrcan_usuario_activo') || 'null');
    ok = !!(u && u.id && u.fechaSesion === hoy()); // misma regla que el portal: la sesión dura el día
  } catch (e) {}
  if (ok) return;
  // Sin sesión: se oculta la página, se detiene su carga y se manda al portal
  try { document.documentElement.style.visibility = 'hidden'; } catch (e) {}
  try { window.stop(); } catch (e) {}
  var volver = location.pathname.split('/').pop() + location.search;
  location.replace('barrcan_brain.html?volver=' + encodeURIComponent(volver));
})();

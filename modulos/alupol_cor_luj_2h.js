/*
  BARRCAN · MÓDULO INDEPENDIENTE — Alu/Polietileno
  Variante  : Corredizo de Lujo, 2 hojas
  ID        : COR-LUJ-2H
  VERSION   : v1.1
  FECHA     : 2026-09-21

  v1.1 - Renombrado ctx.anchoVanoMm/ctx.altoVanoMm → ctx.largoMm/
    ctx.altoMm, para usar el mismo nombre de campo que
    alupol_recto.js y alupol_escuadra.js (extraídos hoy mismo del
    central). Los 3 módulos de Alu/Polietileno ahora comparten el
    mismo shape de ctx, así el central despacha a cualquiera de los
    3 sin código específico por tipo -- solo cambia a qué módulo le
    manda el mismo objeto. Sin cambios de fórmula.
  v1.0 - Primer módulo construido bajo la arquitectura de "módulos
    independientes" acordada con Mau: este archivo contiene SOLO
    catálogo + cálculo de esta variante. Folio, Supabase, PDF e
    impresión siguen viviendo en el central (cotizador_banos.html) y
    NO se tocan aquí -- agregar un modelo nuevo a esta familia no debe
    volver a requerir editar el archivo central.

    Despiece paramétrico derivado del ÚNICO ejemplo real que mandó Mau
    (vano 1800×1900mm, variante COR-LUJ-2H):
      - Riel Superior (clave 9947) : 1 pza = ancho_vano
      - Riel Inferior (clave 10198): 1 pza = ancho_vano
      - Jamba Lateral (clave 10197): 2 pzas = alto_vano c/u
      - Marco H/V Hoja (clave 10103): 4 pzas = ancho_vano/2 c/u
        (2 hojas × 2 piezas por hoja, cada hoja = mitad del vano)
      - Empaque U: fórmula 4×ancho_vano/1000 (ml) -- verificada EXACTA
        contra el ejemplo (1800mm → 7.2ml ✓, coincide dígito por dígito)
      - Carretilla: 4 pzas fijas en el ejemplo (2 por hoja)

    BLOQUEANTE -- calcular() regresa {ok:false, errores:[...]} en vez
    de inventar un total, porque NO hay precio real capturado para:
      · Claves 9947 / 10198 / 10197 / 10103 (perfil aluminio)
      · Carretilla corrediza (pieza distinta a la carretilla de
        Escuadra que ya existe en ALU_PRECIOS.her_carretilla -- esa es
        para clips 90°, no aplica aquí)
      · Empaque U ($/ml)
      · Material del panel: el despiece dice "Empaque... para
        ACRÍLICO", pero la línea Alu/Polietileno existente usa
        POLIETILENO ($300/m² en ALU_PRECIOS.material_m2) -- si esta
        variante de lujo de verdad cambia de material, necesita su
        propio precio/m², no heredar el de polietileno
      · Mano de obra: no se asume la misma MO fija de $600 del resto
        de la línea -- un sistema corredizo de lujo puede requerir otra

    PENDIENTE (no bloqueante, pero afecta precisión):
      · Confirmar si Carretilla escala con el ancho de cada hoja
        (como los kits AQ-150/200/300 de Bacalar) o es fija en 4
      · Confirmar altura real del panel de cada hoja (aquí se usa
        alto_vano completo como aproximación -- puede necesitar
        descuento por riel/jamba, igual que Recto descuenta 1cm en
        la puerta)
      · Definir si aplica el mismo selector Natural/Blanco/Negro
        (factorAcabado) que el resto de Alu/Polietileno, o si "Lujo"
        tiene su propia paleta/recargo

  Convención heredada del central (NO reinventar aquí):
    - Precio de barra completa (610cm) × cm/610 para piezas de aluminio
    - Netificación de IVA de compra ANTES de aplicar márgenes
    - GIF/GA/Utilidad/IVA de venta se RECIBEN del central via ctx.pct
      (no se hardcodean acá) -- así si Mau vuelve a ajustar esos
      porcentajes en config_precios, este módulo los sigue automático
      sin que nadie tenga que tocar este archivo
*/
(function () {
  'use strict';

  // ── Precios propios de ESTA variante (nadie más los usa) ──────
  // TODO Mau: reemplazar los 0 / null con precio real antes de usar
  // en un presupuesto de verdad. Sugerencia de prefijo para cuando
  // se agregue a config_precios: alu_corluj_*
  var PRECIOS = {
    '9947_base': 0,    // Riel Superior -- precio de barra 610cm, Natural
    '10198_base': 0,   // Riel Inferior
    '10197_base': 0,   // Jamba Lateral
    '10103_base': 0,   // Marco H/V Hoja
    her_carretilla_corrediza: 0,  // $/pieza
    her_empaque_u_ml: 0,          // $/metro lineal
    material_m2: null,  // null a propósito -- confirmar polietileno vs acrílico primero
    mdo: null,           // null a propósito -- confirmar MO de este sistema
    factor_blanco_pct: 0,
    factor_negro_pct: 15
  };

  function factorColor(color) {
    return color === 'BLANCO' ? PRECIOS.factor_blanco_pct
         : color === 'NEGRO' ? PRECIOS.factor_negro_pct : 0;
  }

  // Mismo criterio que apCostoPieza() del central: precio de barra
  // completa × cm cortados / 610. Regresa null si falta precio real
  // (nunca calcula con 0 disfrazado de precio real).
  function costoPieza(claveBase, cm, color) {
    var base = PRECIOS[claveBase];
    if (!base) return null;
    var precioBarra = base * (1 + factorColor(color) / 100);
    return (precioBarra * cm) / 610;
  }

  // Despiece paramétrico -- reusable también para una futura hoja de
  // corte (como la que ya existe para Recto), sin tocar calcular().
  function despiece(anchoVanoMm, altoVanoMm) {
    var anchoHoja = anchoVanoMm / 2;
    return {
      rielSuperior: { clave: '9947', descripcion: 'Riel Superior', pzas: 1, longitud_mm: anchoVanoMm },
      rielInferior: { clave: '10198', descripcion: 'Riel Inferior', pzas: 1, longitud_mm: anchoVanoMm },
      jambaLateral: { clave: '10197', descripcion: 'Jamba Lateral', pzas: 2, longitud_mm: altoVanoMm },
      marcoHoja: { clave: '10103', descripcion: 'Marco Horizontal/Vertical Hoja', pzas: 4, longitud_mm: anchoHoja },
      carretilla: { descripcion: 'Carretilla para riel superior', pzas: 4 },
      empaqueU: { descripcion: 'Empaque perimetral', ml: (4 * anchoVanoMm) / 1000 }
    };
  }

  // ctx = { anchoVanoMm, altoVanoMm, color, pct: {gif_pct, ga_pct,
  //         util_pct, iva_compras_pct, iva_venta_pct} } -- pct lo arma
  // el central a partir de su ALU_PRECIOS ya cargado desde Supabase.
  function calcular(ctx) {
    ctx = ctx || {};
    var anchoVanoMm = ctx.largoMm, altoVanoMm = ctx.altoMm, color = ctx.color || 'NATURAL';
    var pct = ctx.pct || {};

    if (!anchoVanoMm || !altoVanoMm) {
      return { ok: false, errores: ['Faltan medidas del vano (ancho/alto)'] };
    }

    var d = despiece(anchoVanoMm, altoVanoMm);
    var errores = [];

    var costoRielSup = costoPieza('9947_base', d.rielSuperior.longitud_mm / 10, color);
    var costoRielInf = costoPieza('10198_base', d.rielInferior.longitud_mm / 10, color);
    var costoJamba = costoPieza('10197_base', (d.jambaLateral.longitud_mm / 10) * d.jambaLateral.pzas, color);
    var costoMarco = costoPieza('10103_base', (d.marcoHoja.longitud_mm / 10) * d.marcoHoja.pzas, color);

    if (costoRielSup === null) errores.push('Falta precio real de clave 9947 (Riel Superior)');
    if (costoRielInf === null) errores.push('Falta precio real de clave 10198 (Riel Inferior)');
    if (costoJamba === null) errores.push('Falta precio real de clave 10197 (Jamba Lateral)');
    if (costoMarco === null) errores.push('Falta precio real de clave 10103 (Marco Hoja)');
    if (!PRECIOS.her_carretilla_corrediza) errores.push('Falta precio de Carretilla corrediza ($/pza)');
    if (!PRECIOS.her_empaque_u_ml) errores.push('Falta precio de Empaque U ($/ml)');
    if (PRECIOS.material_m2 === null) errores.push('Falta confirmar material del panel (¿polietileno o acrílico?) y su precio/m²');
    if (PRECIOS.mdo === null) errores.push('Falta confirmar mano de obra de este sistema');
    if (pct.gif_pct == null || pct.ga_pct == null || pct.util_pct == null || pct.iva_compras_pct == null || pct.iva_venta_pct == null) {
      errores.push('El central no pasó los porcentajes compartidos (GIF/GA/Utilidad/IVA) -- revisar integración');
    }

    if (errores.length) {
      // El BOM sí es correcto y se puede mostrar/imprimir -- lo que
      // falta es SOLO precio, nunca se disfraza un total con ceros.
      return { ok: false, errores: errores, despiece: d };
    }

    var costoAluminio = costoRielSup + costoRielInf + costoJamba + costoMarco;
    var costoHerrajes = (PRECIOS.her_carretilla_corrediza * d.carretilla.pzas)
      + (PRECIOS.her_empaque_u_ml * d.empaqueU.ml);

    // Área aproximada del panel: vano completo (2 hojas). PENDIENTE
    // confirmar si hay que descontar traslape/riel del alto real.
    var m2Material = (anchoVanoMm * altoVanoMm) / 1000000;
    var costoMaterial = PRECIOS.material_m2 * m2Material;

    var costoBruto = costoAluminio + costoHerrajes + costoMaterial;
    var costoNeto = costoBruto / (1 + pct.iva_compras_pct / 100);
    var subtotal = costoNeto + PRECIOS.mdo;
    var gif = subtotal * pct.gif_pct / 100;
    var ga = subtotal * pct.ga_pct / 100;
    var costoReal = subtotal + gif + ga;
    var utilidad = costoReal * pct.util_pct / 100;
    var antesIva = costoReal + utilidad;
    var ivaVenta = antesIva * pct.iva_venta_pct / 100;
    var precioFinal = antesIva + ivaVenta;

    return {
      ok: true,
      sistema: 'Aluminio/Polietileno Corredizo de Lujo 2H ' + color,
      L: anchoVanoMm, H: altoVanoMm,
      precioFinal: precioFinal,
      tipo: 'alupol', apTipo: 'corredizo_lujo', apColor: color,
      desglose: {
        costoAluminio: costoAluminio, costoHerrajes: costoHerrajes, costoMaterial: costoMaterial,
        mdo: PRECIOS.mdo, gif: gif, ga: ga, utilidad: utilidad, iva: ivaVenta
      },
      despiece: d
    };
  }

  // Registro en namespace global -- evita el bug conocido de IIFE
  // (funciones inaccesibles desde onclick si no se exponen a window).
  window.BC_MODULOS = window.BC_MODULOS || {};
  window.BC_MODULOS['ALUPOL_COR_LUJ_2H'] = {
    id: 'COR-LUJ-2H',
    linea: 'alupol',
    label: 'Corredizo de Lujo (2 hojas)',
    version: '1.1',
    precios: PRECIOS,   // el central puede sobreescribir tras leer config_precios
    calcular: calcular,
    despiece: despiece
  };
})();

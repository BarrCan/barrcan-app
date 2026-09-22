/*
  BARRCAN · MÓDULO INDEPENDIENTE — Alu/Polietileno
  Variante  : Escuadra (2 muros)
  ID        : ALUPOL-ESCUADRA
  VERSION   : v1.0
  FECHA     : 2026-09-21

  v1.0 - Extraído de apCalcular() (central, rama AP_TIPO==='escuadra')
    como parte de la migración a módulos independientes -- MISMA
    fórmula, sin cambios de comportamiento, solo movido de lugar.
    Mismo criterio que alupol_recto.js: NO trae copia propia de precios
    de catálogo (compartidos con Recto vía config_precios/ALU_PRECIOS
    del central, pasados como ctx.precios en cada cálculo) -- así una
    edición de precio en config.html sigue aplicando aquí sin tocar
    este archivo.
*/
(function () {
  'use strict';

  function factorColor(precios, color) {
    return color === 'BLANCO' ? precios.factor_blanco_pct
         : color === 'NEGRO'  ? precios.factor_negro_pct : 0;
  }
  function costoPieza(precios, claveBase, cm, color) {
    var base = precios[claveBase + '_base'];
    var precioBarra = base * (1 + factorColor(precios, color) / 100);
    return (precioBarra * cm) / 610;
  }

  function calcular(ctx) {
    ctx = ctx || {};
    var precios = ctx.precios;
    var color = ctx.color || 'NATURAL';
    var nivel = ctx.nivel || 'semilujo';

    if (!precios) return { ok: false, errores: ['El central no pasó ALU_PRECIOS -- revisar integración'] };

    var largo = (ctx.largoMm || 0) / 10;
    var alto = (ctx.altoMm || 0) / 10;
    var largo2 = (ctx.largo2Mm || 0) / 10;
    if (!largo || !alto || !largo2) return { ok: false, errores: ['Faltan medidas (incluye Largo 2 del segundo muro)'] };

    var claveMoldura = nivel === 'economico' ? '670' : nivel === 'lujo' ? '676' : '671';

    var cmRiel = largo + largo2;
    var cmJambaInf = largo + largo2;
    var cmJambaLat = alto * 2;
    var cmMoldura = ((largo + alto * 2) * 2) + ((largo2 + alto * 2) * 2);
    var qCarretilla = 4, qJaladera = 2, qEscuadra = 16;
    var kgVinil = (((largo / 2) * 4 * alto) + ((largo2 / 2) * 4 * alto)) / 12000;
    var qSilicon = 1, qRemache = 80;
    var m2Material = ((alto * largo) + (alto * largo2)) / 10000;

    var costoAluminio = costoPieza(precios, '674', cmRiel, color)
      + costoPieza(precios, '675', cmJambaInf, color)
      + costoPieza(precios, '677', cmJambaLat, color)
      + costoPieza(precios, claveMoldura, cmMoldura, color);

    var costoHerrajes = precios.her_carretilla * qCarretilla
      + precios.her_jaladera * qJaladera
      + precios.her_escuadra * qEscuadra
      + precios.her_vinil_kg * kgVinil
      + precios.her_silicon * qSilicon
      + (precios.her_remache * qRemache) / 100;

    var costoMaterial = precios.material_m2 * m2Material;

    var costoBruto = costoAluminio + costoHerrajes + costoMaterial;
    var costoNeto = costoBruto / (1 + precios.iva_compras_pct / 100);
    var subtotal = costoNeto + precios.mdo;
    var gif = subtotal * precios.gif_pct / 100;
    var ga = subtotal * precios.ga_pct / 100;
    var costoReal = subtotal + gif + ga;
    var utilidad = costoReal * precios.util_pct / 100;
    var antesIva = costoReal + utilidad;
    var ivaVenta = antesIva * precios.iva_venta_pct / 100;
    var precioFinal = antesIva + ivaVenta;

    var nivelLabel = nivel === 'economico' ? 'Económico' : nivel === 'lujo' ? 'Lujo' : 'Semi Lujo';

    return {
      ok: true,
      sistema: 'Aluminio/Polietileno Escuadra ' + nivelLabel + ' ' + color,
      L: (largo * 10) + '+' + (largo2 * 10), H: alto * 10,
      precioFinal: precioFinal,
      tipo: 'alupol', apTipo: 'escuadra', apNivel: nivel, apColor: color,
      largo: largo, largo2: largo2, alto: alto,
      desglose: {
        costoAluminio: costoAluminio, costoHerrajes: costoHerrajes, costoMaterial: costoMaterial,
        mdo: precios.mdo, gif: gif, ga: ga, utilidad: utilidad, iva: ivaVenta
      }
    };
  }

  window.BC_MODULOS = window.BC_MODULOS || {};
  window.BC_MODULOS['ALUPOL_ESCUADRA'] = {
    id: 'ALUPOL-ESCUADRA',
    linea: 'alupol',
    label: 'Escuadra (2 muros)',
    version: '1.0',
    calcular: calcular
  };
})();

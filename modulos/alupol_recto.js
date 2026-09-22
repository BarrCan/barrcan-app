/*
  BARRCAN · MÓDULO INDEPENDIENTE — Alu/Polietileno
  Variante  : Recto (1 muro)
  ID        : ALUPOL-RECTO
  VERSION   : v1.0
  FECHA     : 2026-09-21

  v1.0 - Extraído de apCalcular() (central, rama AP_TIPO==='recto')
    como parte de la migración a módulos independientes -- MISMA
    fórmula, sin cambios de comportamiento, solo movido de lugar.

    A diferencia de alupol_cor_luj_2h.js, este módulo NO trae su
    propia copia de precios de catálogo: las claves 674/675/677/67x,
    herrajes (carretilla/jaladera/escuadra/vinil/silicón/remache) y los
    % de indirectos (GIF/GA/Utilidad/IVA) son compartidos con Escuadra
    y YA se sincronizan desde Supabase (config_precios, prefijo alu_)
    hacia ALU_PRECIOS en el central. Si este módulo trajera su propia
    copia hardcodeada, la edición de precios en config.html dejaría de
    reflejarse aquí sin que nadie lo note -- por eso el central manda
    su ALU_PRECIOS ya cargado como ctx.precios en cada cálculo, en vez
    de que el módulo traiga nada por su cuenta.
*/
(function () {
  'use strict';

  function factorColor(precios, color) {
    return color === 'BLANCO' ? precios.factor_blanco_pct
         : color === 'NEGRO'  ? precios.factor_negro_pct : 0;
  }
  // Mismo criterio que el central: precio de barra completa (610cm) ×
  // cm cortados / 610.
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
    if (!largo || !alto) return { ok: false, errores: ['Faltan medidas'] };

    var claveMoldura = nivel === 'economico' ? '670' : nivel === 'lujo' ? '676' : '671';

    var cmRiel = largo;
    var cmJambaInf = largo;
    var cmJambaLat = alto * 2;
    var cmMoldura = (largo + alto * 2) * 2;
    var qCarretilla = 4, qJaladera = 2, qEscuadra = 8;
    var kgVinil = ((largo / 2) * 4 * alto) / 12000;
    var qSilicon = 0.5, qRemache = 40;
    var m2Material = (alto * largo) / 10000;

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
      sistema: 'Aluminio/Polietileno Recto ' + nivelLabel + ' ' + color,
      L: largo * 10, H: alto * 10,
      precioFinal: precioFinal,
      tipo: 'alupol', apTipo: 'recto', apNivel: nivel, apColor: color,
      largo: largo, largo2: null, alto: alto,
      desglose: {
        costoAluminio: costoAluminio, costoHerrajes: costoHerrajes, costoMaterial: costoMaterial,
        mdo: precios.mdo, gif: gif, ga: ga, utilidad: utilidad, iva: ivaVenta
      }
    };
  }

  window.BC_MODULOS = window.BC_MODULOS || {};
  window.BC_MODULOS['ALUPOL_RECTO'] = {
    id: 'ALUPOL-RECTO',
    linea: 'alupol',
    label: 'Recto (1 muro)',
    version: '1.0',
    calcular: calcular
  };
})();

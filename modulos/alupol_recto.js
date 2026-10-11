/*
  BARRCAN · MÓDULO INDEPENDIENTE — Alu/Polietileno
  Variante  : Recto (1 muro)
  ID        : ALUPOL-RECTO
  VERSION   : v1.3
  FECHA     : 2026-10-11

  v1.3 - La INSTALACIÓN ya NO entra a la base de costos (antes subía el
    precio $971.70). Ahora es un CARGO DIRECTO de $500 con IVA incluido
    (precios.instalacion, clave alu_instalacion) que se suma después de la
    utilidad: el precio final sube exactamente $500. Se le quita el IVA
    ($431.03) antes de sumarlo, y el IVA de venta se calcula sobre el total.

  v1.2 - INSTALACIÓN incluida (11-oct-2026): se suma $500 de instalación
    (precios.instalacion, clave alu_instalacion) a la mano de obra de
    fabricación ($600). Va dentro de la base de costos, así que recibe
    GIF, GA, utilidad e IVA igual que el resto. desglose.mdo = total;
    mdoFabricacion y mdoInstalacion por separado.

  v1.1 - Fórmula corregida por Mau (11-oct-2026):
    · Moldura = ((largo × 2) + (alto × 2)) × 2 -- perímetro completo, en
      las dos caras. Antes era (largo + alto × 2) × 2.
    · Jaladeras: 4 (antes 2). Carretillas 4, escuadras 8, silicón ½ y
      remaches 40 no cambian.
    · Un solo nivel: Semi Lujo (moldura clave 671). Económico y Lujo se
      eliminaron.
    · El polietileno ($/m²) viene de ALU_PRECIOS.material_m2 ($350).

  Versión original: v1.0, 2026-09-21

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

    if (!precios) return { ok: false, errores: ['El central no pasó ALU_PRECIOS -- revisar integración'] };

    var largo = (ctx.largoMm || 0) / 10;
    var alto = (ctx.altoMm || 0) / 10;
    if (!largo || !alto) return { ok: false, errores: ['Faltan medidas'] };

    var claveMoldura = '671'; // único nivel: Semi Lujo

    var cmRiel = largo;
    var cmJambaInf = largo;
    var cmJambaLat = alto * 2;
    var cmMoldura = ((largo * 2) + (alto * 2)) * 2; // perímetro completo, dos caras
    var qCarretilla = 4, qJaladera = 4, qEscuadra = 8;
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
    var mdoFab = precios.mdo || 0, instalacion = precios.instalacion || 0;
    var subtotal = costoNeto + mdoFab; // la instalación NO entra a la base de costos
    var gif = subtotal * precios.gif_pct / 100;
    var ga = subtotal * precios.ga_pct / 100;
    var costoReal = subtotal + gif + ga;
    var utilidad = costoReal * precios.util_pct / 100;
    var instNeto = instalacion / (1 + precios.iva_venta_pct / 100); // cargo directo, IVA incluido
    var antesIva = costoReal + utilidad + instNeto;
    var ivaVenta = antesIva * precios.iva_venta_pct / 100;
    var precioFinal = antesIva + ivaVenta;

    return {
      ok: true,
      sistema: 'Aluminio/Polietileno Recto Semi Lujo ' + color,
      L: largo * 10, H: alto * 10,
      precioFinal: precioFinal,
      tipo: 'alupol', apTipo: 'recto', apNivel: 'semilujo', apColor: color,
      largo: largo, largo2: null, alto: alto,
      desglose: {
        costoAluminio: costoAluminio, costoHerrajes: costoHerrajes, costoMaterial: costoMaterial,
        mdo: mdoFab, mdoFabricacion: mdoFab, mdoInstalacion: instalacion, gif: gif, ga: ga, utilidad: utilidad, iva: ivaVenta
      }
    };
  }

  window.BC_MODULOS = window.BC_MODULOS || {};
  window.BC_MODULOS['ALUPOL_RECTO'] = {
    id: 'ALUPOL-RECTO',
    linea: 'alupol',
    label: 'Recto (1 muro)',
    version: '1.3',
    calcular: calcular
  };
})();

/*
  BARRCAN · MÓDULO INDEPENDIENTE — Alu/Polietileno
  Variante  : Escuadra (2 muros)
  ID        : ALUPOL-ESCUADRA
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

  v1.1 - Fórmula corregida por Mau (11-oct-2026): suma los dos muros.
    · Moldura de cada muro = ((largo × 2) + (alto × 2)) × 2 (perímetro
      completo, dos caras); se suman los dos muros. Antes era
      (largo + alto × 2) × 2 por muro.
    · Jaladeras: 4 (antes 2). Carretillas 4, escuadras 16, silicón 1 y
      remaches 80 no cambian.
    · Un solo nivel: Semi Lujo (moldura clave 671).
    · El polietileno ($/m²) viene de ALU_PRECIOS.material_m2 ($350).

  Versión original: v1.0, 2026-09-21

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

    if (!precios) return { ok: false, errores: ['El central no pasó ALU_PRECIOS -- revisar integración'] };

    var largo = (ctx.largoMm || 0) / 10;
    var alto = (ctx.altoMm || 0) / 10;
    var largo2 = (ctx.largo2Mm || 0) / 10;
    if (!largo || !alto || !largo2) return { ok: false, errores: ['Faltan medidas (incluye Largo 2 del segundo muro)'] };

    var claveMoldura = '671'; // único nivel: Semi Lujo

    var cmRiel = largo + largo2;
    var cmJambaInf = largo + largo2;
    var cmJambaLat = alto * 2;
    var cmMoldura = (((largo * 2) + (alto * 2)) * 2) + (((largo2 * 2) + (alto * 2)) * 2); // cada muro: perímetro completo, dos caras
    var qCarretilla = 4, qJaladera = 4, qEscuadra = 16;
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
      sistema: 'Aluminio/Polietileno Escuadra Semi Lujo ' + color,
      L: (largo * 10) + '+' + (largo2 * 10), H: alto * 10,
      precioFinal: precioFinal,
      tipo: 'alupol', apTipo: 'escuadra', apNivel: 'semilujo', apColor: color,
      largo: largo, largo2: largo2, alto: alto,
      desglose: {
        costoAluminio: costoAluminio, costoHerrajes: costoHerrajes, costoMaterial: costoMaterial,
        mdo: mdoFab, mdoFabricacion: mdoFab, mdoInstalacion: instalacion, gif: gif, ga: ga, utilidad: utilidad, iva: ivaVenta
      }
    };
  }

  window.BC_MODULOS = window.BC_MODULOS || {};
  window.BC_MODULOS['ALUPOL_ESCUADRA'] = {
    id: 'ALUPOL-ESCUADRA',
    linea: 'alupol',
    label: 'Escuadra (2 muros)',
    version: '1.3',
    calcular: calcular
  };
})();

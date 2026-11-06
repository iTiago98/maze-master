// Valida el JSON de un nivel y lo convierte en el modelo normalizado.
// Formato y modelo: docs/CONTRATOS.md, secciones 2 y 3.

import { CELDA, VERSION_FORMATO } from '../constantes.js';

const BIT_HORIZONTAL = 1;
const BIT_VERTICAL = 2;

function esObjetoPlano(valor) {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function validarLayout(layout) {
  if (!Array.isArray(layout) || layout.length === 0 || !Array.isArray(layout[0]) || layout[0].length === 0) {
    throw new Error('Falta "layout" o está vacío');
  }
  layout.forEach((fila, i) => {
    if (!Array.isArray(fila) || fila.length !== layout[0].length) {
      throw new Error(`La fila ${i} no tiene ${layout[0].length} columnas`);
    }
    fila.forEach((valor, j) => {
      if (![0, 1, 2, 3].includes(valor)) throw new Error(`Valor inválido en fila ${i}, columna ${j}`);
    });
  });
}

function leerVersion(datos, avisos) {
  if (datos.version === undefined) return 1;
  if (!Number.isInteger(datos.version) || datos.version < 1) {
    throw new Error('"version" debe ser un entero positivo');
  }
  if (datos.version > VERSION_FORMATO) {
    avisos.push(
      `El nivel usa la versión ${datos.version} del formato y este visor entiende hasta la ${VERSION_FORMATO}: se ignora lo que no conoce`
    );
  }
  return datos.version;
}

function crearMuro(x, y, horizontal) {
  const dir = horizontal ? { x: 1, z: 0 } : { x: 0, z: 1 };
  const a = { x: x * CELDA, z: y * CELDA };
  return {
    id: `${x},${y},${horizontal ? 'h' : 'v'}`,
    tipo: 'pared',
    horizontal,
    a,
    b: { x: a.x + dir.x * CELDA, z: a.z + dir.z * CELDA },
    dir,
    props: {}
  };
}

function construirMuros(layout, avisos) {
  const filas = layout.length;
  const columnas = layout[0].length;
  const muros = [];
  for (let y = 0; y < filas; y++) {
    for (let x = 0; x < columnas; x++) {
      const valor = layout[y][x];
      if (valor & BIT_HORIZONTAL) {
        if (x + 1 < columnas) muros.push(crearMuro(x, y, true));
        else avisos.push(`Muro horizontal fuera de la matriz en fila ${y}, columna ${x}: se ignora`);
      }
      if (valor & BIT_VERTICAL) {
        if (y + 1 < filas) muros.push(crearMuro(x, y, false));
        else avisos.push(`Muro vertical fuera de la matriz en fila ${y}, columna ${x}: se ignora`);
      }
    }
  }
  return muros;
}

function aplicarAnotaciones(muros, anotaciones, avisos, tiposConocidos) {
  if (anotaciones === undefined) return;
  if (!esObjetoPlano(anotaciones)) throw new Error('"muros" debe ser un objeto');
  const porId = new Map(muros.map((muro) => [muro.id, muro]));
  for (const [id, anotacion] of Object.entries(anotaciones)) {
    const muro = porId.get(id);
    if (!muro) throw new Error(`El muro "${id}" no existe en el layout`);
    if (!esObjetoPlano(anotacion)) throw new Error(`La anotación de "${id}" debe ser un objeto`);
    const { tipo, ...props } = anotacion;
    if (tipo !== undefined && (typeof tipo !== 'string' || tipo === '')) {
      throw new Error(`El "tipo" de "${id}" debe ser un texto`);
    }
    muro.tipo = tipo ?? 'pared';
    muro.props = structuredClone(props);
    if (tiposConocidos && !tiposConocidos.includes(muro.tipo)) {
      avisos.push(`Tipo de muro desconocido "${muro.tipo}" en ${id}: se trata como pared normal`);
    }
  }
}

// Celda libre (sin muros en sus cuatro lados) más cercana al centro del plano, en celdas.
function celdaInicialPorDefecto(layout) {
  const filas = layout.length;
  const columnas = layout[0].length;
  const hay = (x, y, bit) => y >= 0 && y < filas && x >= 0 && x < columnas && (layout[y][x] & bit) !== 0;
  const centroX = (columnas - 1) / 2;
  const centroY = (filas - 1) / 2;
  let mejor = null;
  let mejorDistancia = Infinity;
  for (let y = 0; y < filas - 1; y++) {
    for (let x = 0; x < columnas - 1; x++) {
      if (hay(x, y, BIT_HORIZONTAL) || hay(x, y + 1, BIT_HORIZONTAL)) continue;
      if (hay(x, y, BIT_VERTICAL) || hay(x + 1, y, BIT_VERTICAL)) continue;
      const distancia = Math.hypot(x + 0.5 - centroX, y + 0.5 - centroY);
      if (distancia < mejorDistancia) {
        mejorDistancia = distancia;
        mejor = { x: x + 0.5, y: y + 0.5 };
      }
    }
  }
  return mejor ?? { x: Math.floor(centroX) + 0.5, y: Math.floor(centroY) + 0.5 };
}

function leerInicio(datos) {
  if (datos.inicio === undefined) {
    const celda = celdaInicialPorDefecto(datos.layout);
    return { x: celda.x * CELDA, z: celda.y * CELDA, yaw: 0 };
  }
  const { inicio } = datos;
  if (!esObjetoPlano(inicio) || !Number.isFinite(inicio.x) || !Number.isFinite(inicio.y)) {
    throw new Error('"inicio" necesita "x" e "y" numéricos (en celdas)');
  }
  if (inicio.angulo !== undefined && !Number.isFinite(inicio.angulo)) {
    throw new Error('"inicio.angulo" debe ser un número (en grados)');
  }
  return { x: inicio.x * CELDA, z: inicio.y * CELDA, yaw: ((inicio.angulo ?? 0) * Math.PI) / 180 };
}

function leerCosas(cosas) {
  if (cosas === undefined) return [];
  if (!Array.isArray(cosas)) throw new Error('"cosas" debe ser una lista');
  return cosas.map((cosa, i) => {
    const valida =
      esObjetoPlano(cosa) &&
      typeof cosa.tipo === 'string' &&
      cosa.tipo !== '' &&
      Number.isFinite(cosa.x) &&
      Number.isFinite(cosa.y);
    if (!valida) throw new Error(`La cosa ${i} necesita "tipo" (texto) y "x", "y" numéricos (en celdas)`);
    const { tipo, x, y, ...props } = cosa;
    return { id: `cosa-${i}`, tipo, x: x * CELDA, z: y * CELDA, props: structuredClone(props) };
  });
}

// Lanza un Error con un mensaje legible si el JSON no es válido. No modifica `datos`.
export function cargarNivel(datos, opciones = {}) {
  if (!esObjetoPlano(datos)) throw new Error('El nivel debe ser un objeto JSON');
  validarLayout(datos.layout);

  const avisos = [];
  const version = leerVersion(datos, avisos);
  const muros = construirMuros(datos.layout, avisos);
  aplicarAnotaciones(muros, datos.muros, avisos, opciones.tiposConocidos);

  const columnas = datos.layout[0].length;
  const filas = datos.layout.length;
  return {
    version,
    columnas,
    filas,
    limites: { ancho: (columnas - 1) * CELDA, fondo: (filas - 1) * CELDA },
    muros,
    cosas: leerCosas(datos.cosas),
    inicio: leerInicio(datos),
    avisos
  };
}

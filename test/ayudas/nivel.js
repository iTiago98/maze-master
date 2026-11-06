// Datos de prueba compartidos: el nivel de ejemplo de datos/nivel.json.

import { readFileSync } from 'node:fs';
import { crearEstado, nombresDeTipos } from '../../src/logica/index.js';
import { cargarNivel } from '../../src/nivel/formato.js';

export const datosEjemplo = JSON.parse(
  readFileSync(new URL('../../datos/nivel.json', import.meta.url), 'utf8')
);

// Copia profunda del nivel de ejemplo, para modificarla en una prueba.
export function copiaEjemplo() {
  return structuredClone(datosEjemplo);
}

export function crearJuegoDe(datos = datosEjemplo) {
  const modelo = cargarNivel(datos, { tiposConocidos: nombresDeTipos() });
  return { modelo, estado: crearEstado(modelo) };
}

export function colocar(estado, x, z, yaw = 0) {
  Object.assign(estado.jugador, { x, z, yaw });
}

export function casiIgual(a, b, margen = 1e-9) {
  return Math.abs(a - b) <= margen;
}

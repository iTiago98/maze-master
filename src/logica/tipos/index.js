// Registro de los tipos de muro de la lógica. Interfaz: docs/CONTRATOS.md, sección 8.

import pared from './pared.js';
import puerta from './puerta.js';

// Valores por defecto: un tipo solo define lo que necesita.
const BASE = {
  estadoInicial() {
    return null; // sin estado
  },
  segmentosBloqueantes(muro) {
    return [[muro.a.x, muro.a.z, muro.b.x, muro.b.z]];
  },
  zonaInteractiva() {
    return null;
  },
  texto() {
    return '';
  },
  interactuar() {
    return [];
  },
  actualizar() {}
};

// Para añadir un tipo: crea su archivo en esta carpeta y añade una línea aquí.
export const TIPOS_REGISTRADOS = [pared, puerta];

export const METODOS_DE_TIPO = Object.keys(BASE);

const porNombre = new Map(TIPOS_REGISTRADOS.map((tipo) => [tipo.nombre, { ...BASE, ...tipo }]));

export function nombresDeTipos() {
  return [...porNombre.keys()];
}

// Un tipo desconocido se trata como pared normal.
export function tipoDe(nombre) {
  return porNombre.get(nombre) ?? porNombre.get('pared');
}

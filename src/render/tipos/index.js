// Registro de los tipos de muro del render. Interfaz: docs/CONTRATOS.md, sección 8.

import pared from './pared.js';
import puerta from './puerta.js';

// Para añadir un tipo: crea su archivo en esta carpeta y añade una línea aquí.
export const TIPOS_DE_RENDER = [pared, puerta];

const porNombre = new Map(TIPOS_DE_RENDER.map((tipo) => [tipo.nombre, tipo]));

export function nombresDeTiposDeRender() {
  return [...porNombre.keys()];
}

// Un tipo desconocido se dibuja como pared normal.
export function tipoDeRender(nombre) {
  return porNombre.get(nombre) ?? porNombre.get('pared');
}

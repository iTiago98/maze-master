// API pública de la lógica: ver docs/CONTRATOS.md, sección 7.
// Sin DOM ni render: recibe datos y acciones, y devuelve eventos.

import { interactuar } from './interaccion.js';
import { moverJugador } from './movimiento.js';
import { tipoDe } from './tipos/index.js';

export { crearEstado } from './estado.js';
export { consultarInteraccion } from './interaccion.js';
export { nombresDeTipos } from './tipos/index.js';

// Avanza el juego un fotograma. Devuelve la lista de eventos ocurridos.
export function actualizar(modelo, estado, acciones, dt) {
  const eventos = [];
  if (acciones.alternarColisiones) estado.opciones.colisiones = !estado.opciones.colisiones;

  moverJugador(modelo, estado, acciones, dt);
  if (acciones.interactuar) eventos.push(...interactuar(modelo, estado));

  for (const muro of modelo.muros) {
    const est = estado.muros[muro.id];
    if (est !== undefined) tipoDe(muro.tipo).actualizar(muro, est, dt, estado);
  }
  return eventos;
}

// Colisiones del jugador (un círculo) contra los segmentos que bloquean.

import { GROSOR, RADIO_JUGADOR } from '../constantes.js';
import { tipoDe } from './tipos/index.js';

// Todos los segmentos [ax, az, bx, bz] que bloquean al jugador ahora mismo.
export function segmentosBloqueantes(modelo, estado) {
  const segmentos = [];
  for (const muro of modelo.muros) {
    segmentos.push(...tipoDe(muro.tipo).segmentosBloqueantes(muro, estado.muros[muro.id], estado));
  }
  return segmentos;
}

// Empuja al jugador fuera del segmento si lo está atravesando.
function empujar(jugador, ax, az, bx, bz) {
  const distanciaMinima = RADIO_JUGADOR + GROSOR / 2;
  const dx = bx - ax;
  const dz = bz - az;
  const t = Math.max(0, Math.min(1, ((jugador.x - ax) * dx + (jugador.z - az) * dz) / (dx * dx + dz * dz)));
  const cercanoX = ax + t * dx;
  const cercanoZ = az + t * dz;
  let ux = jugador.x - cercanoX;
  let uz = jugador.z - cercanoZ;
  const distancia = Math.hypot(ux, uz);
  if (distancia >= distanciaMinima) return;
  if (distancia < 1e-6) {
    // Justo encima del segmento: se empuja en su perpendicular.
    ux = -dz;
    uz = dx;
    const norma = Math.hypot(ux, uz);
    ux /= norma;
    uz /= norma;
  } else {
    ux /= distancia;
    uz /= distancia;
  }
  jugador.x = cercanoX + ux * distanciaMinima;
  jugador.z = cercanoZ + uz * distanciaMinima;
}

export function resolverColisiones(jugador, segmentos) {
  for (let iteracion = 0; iteracion < 3; iteracion++) {
    for (const [ax, az, bx, bz] of segmentos) empujar(jugador, ax, az, bx, bz);
  }
}

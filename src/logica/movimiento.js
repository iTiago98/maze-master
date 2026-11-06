// Giro y desplazamiento del jugador a partir de las acciones.

import { VELOCIDAD, VELOCIDAD_GIRO } from '../constantes.js';
import { resolverColisiones, segmentosBloqueantes } from './colisiones.js';

export function moverJugador(modelo, estado, acciones, dt) {
  const jugador = estado.jugador;
  jugador.yaw += acciones.girar * VELOCIDAD_GIRO * dt;

  const { avanzar, lateral } = acciones;
  if (!avanzar && !lateral) return;

  const adelanteX = -Math.sin(jugador.yaw);
  const adelanteZ = -Math.cos(jugador.yaw);
  const derechaX = Math.cos(jugador.yaw);
  const derechaZ = -Math.sin(jugador.yaw);
  const dx = adelanteX * avanzar + derechaX * lateral;
  const dz = adelanteZ * avanzar + derechaZ * lateral;
  const norma = Math.hypot(dx, dz);
  if (norma === 0) return;

  jugador.x += (dx / norma) * VELOCIDAD * dt;
  jugador.z += (dz / norma) * VELOCIDAD * dt;
  if (estado.opciones.colisiones) resolverColisiones(jugador, segmentosBloqueantes(modelo, estado));
}

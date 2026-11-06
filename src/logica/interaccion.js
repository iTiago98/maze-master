// Qué hay delante del jugador y qué ocurre al interactuar con ello.

import { ALCANCE_INTERACCION } from '../constantes.js';
import { tipoDe } from './tipos/index.js';

// El objetivo es la zona interactiva más cercana que esté al alcance y delante del jugador.
function buscarObjetivo(modelo, estado) {
  const jugador = estado.jugador;
  const miradaX = -Math.sin(jugador.yaw);
  const miradaZ = -Math.cos(jugador.yaw);
  let mejor = null;
  let mejorDistancia = ALCANCE_INTERACCION;

  for (const muro of modelo.muros) {
    const tipo = tipoDe(muro.tipo);
    const est = estado.muros[muro.id];
    const zona = tipo.zonaInteractiva(muro, est, estado);
    if (!zona) continue;

    const [ax, az, bx, bz] = zona;
    const dx = bx - ax;
    const dz = bz - az;
    const t = Math.max(0, Math.min(1, ((jugador.x - ax) * dx + (jugador.z - az) * dz) / (dx * dx + dz * dz)));
    const haciaX = ax + t * dx - jugador.x;
    const haciaZ = az + t * dz - jugador.z;
    const distancia = Math.hypot(haciaX, haciaZ);
    const delante = (haciaX * miradaX + haciaZ * miradaZ) / distancia > 0.5;
    if (distancia < mejorDistancia && distancia > 1e-6 && delante) {
      mejor = { muro, tipo, est };
      mejorDistancia = distancia;
    }
  }
  return mejor;
}

// { id, texto } del objetivo actual, o null si no hay nada con lo que interactuar.
export function consultarInteraccion(modelo, estado) {
  const objetivo = buscarObjetivo(modelo, estado);
  if (!objetivo) return null;
  const { muro, tipo, est } = objetivo;
  return { id: muro.id, texto: tipo.texto(muro, est, estado) };
}

// Devuelve los eventos que produce interactuar con el objetivo actual.
export function interactuar(modelo, estado) {
  const objetivo = buscarObjetivo(modelo, estado);
  if (!objetivo) return [];
  const { muro, tipo, est } = objetivo;
  return tipo.interactuar(muro, est, estado) ?? [];
}

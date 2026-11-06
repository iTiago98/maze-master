// Estado del juego: ver docs/CONTRATOS.md, sección 4.

import { crearInventario } from './inventario.js';
import { tipoDe } from './tipos/index.js';

export function crearEstado(modelo) {
  const muros = {};
  for (const muro of modelo.muros) {
    const estadoDelMuro = tipoDe(muro.tipo).estadoInicial(muro);
    if (estadoDelMuro != null) muros[muro.id] = estadoDelMuro;
  }
  return {
    jugador: { x: modelo.inicio.x, z: modelo.inicio.z, yaw: modelo.inicio.yaw },
    muros,
    inventario: crearInventario(),
    opciones: { colisiones: true }
  };
}

// Puerta: un hueco en el muro cerrado por una hoja que se recoge al abrirla.
// Propiedad opcional del JSON: "llave" (texto), por ejemplo "roja".

import { CELDA, PUERTA_DURACION, PUERTA_POSTE, PUERTA_UMBRAL_ABIERTA } from '../../constantes.js';
import { tiene } from '../inventario.js';

// Segmento [ax, az, bx, bz] del muro entre las distancias u0 y u1 desde su origen.
function tramo(muro, u0, u1) {
  return [
    muro.a.x + muro.dir.x * u0,
    muro.a.z + muro.dir.z * u0,
    muro.a.x + muro.dir.x * u1,
    muro.a.z + muro.dir.z * u1
  ];
}

function faltaLlave(muro, estado) {
  const llave = muro.props.llave;
  return typeof llave === 'string' && !tiene(estado.inventario, `llave:${llave}`);
}

export default {
  nombre: 'puerta',

  estadoInicial() {
    return { abierta: 0, abriendo: false }; // abierta: 0 cerrada, 1 abierta del todo
  },

  segmentosBloqueantes(muro, est) {
    if (est.abierta >= PUERTA_UMBRAL_ABIERTA) {
      // Abierta: solo bloquean los dos tramos de muro a cada lado del hueco.
      return [tramo(muro, 0, PUERTA_POSTE), tramo(muro, CELDA - PUERTA_POSTE, CELDA)];
    }
    return [tramo(muro, 0, CELDA)];
  },

  zonaInteractiva(muro, est) {
    return est.abriendo ? null : tramo(muro, PUERTA_POSTE, CELDA - PUERTA_POSTE);
  },

  texto(muro, est, estado) {
    return faltaLlave(muro, estado) ? `Necesitas la llave ${muro.props.llave}` : 'E · abrir puerta';
  },

  interactuar(muro, est, estado) {
    if (est.abriendo) return [];
    if (faltaLlave(muro, estado)) {
      return [{ tipo: 'puerta-bloqueada', id: muro.id, llave: muro.props.llave }];
    }
    est.abriendo = true;
    return [{ tipo: 'puerta-abriendo', id: muro.id }];
  },

  actualizar(muro, est, dt) {
    if (est.abriendo && est.abierta < 1) {
      est.abierta = Math.min(1, est.abierta + dt / PUERTA_DURACION);
    }
  }
};

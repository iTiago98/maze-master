// Pared normal: una caja a lo largo de todo el muro. Es estática (no devuelve animador).

import { ALTO, CELDA, GROSOR } from '../../constantes.js';

export default {
  nombre: 'pared',
  construir(THREE, ctx, muro) {
    ctx.caja(muro, -GROSOR / 2, CELDA + GROSOR / 2, 0, ALTO, GROSOR, ctx.materiales.pared);
    return null;
  }
};

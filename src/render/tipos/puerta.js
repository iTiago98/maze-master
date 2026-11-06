// Puerta: muro normal a ambos lados del hueco, un dintel y una hoja de otro color que se recoge hacia arriba.

import { ALTO, CELDA, GROSOR, PUERTA_ALTO, PUERTA_POSTE } from '../../constantes.js';

export default {
  nombre: 'puerta',
  construir(THREE, ctx, muro) {
    const { caja, materiales } = ctx;
    caja(muro, -GROSOR / 2, PUERTA_POSTE, 0, ALTO, GROSOR, materiales.pared);
    caja(muro, CELDA - PUERTA_POSTE, CELDA + GROSOR / 2, 0, ALTO, GROSOR, materiales.pared);
    caja(muro, PUERTA_POSTE, CELDA - PUERTA_POSTE, PUERTA_ALTO, ALTO, GROSOR, materiales.pared);
    const hoja = caja(muro, PUERTA_POSTE, CELDA - PUERTA_POSTE, 0, PUERTA_ALTO, GROSOR + 0.04, materiales.puerta);

    return {
      actualizar(est) {
        const altura = Math.max(1 - est.abierta, 0.001);
        hoja.visible = est.abierta < 1;
        hoja.scale.y = altura;
        hoja.position.y = PUERTA_ALTO - (PUERTA_ALTO * altura) / 2;
      }
    };
  }
};

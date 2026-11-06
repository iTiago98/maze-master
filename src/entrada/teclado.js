// Teclado → acciones (docs/CONTRATOS.md, sección 5).
// W A S D mueven, ← → giran, E interactúa, C alterna las colisiones, T alterna el techo.

import { accionesVacias } from '../acciones.js';

const BLOQUEADAS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'];

export function crearTeclado(objetivo) {
  const pulsadas = new Set();
  let interactuar = false;
  let alternarColisiones = false;
  let alternarTecho = false;

  const alBajar = (evento) => {
    if (BLOQUEADAS.includes(evento.code)) evento.preventDefault();
    if (!evento.repeat) {
      if (evento.code === 'KeyE') interactuar = true;
      if (evento.code === 'KeyC') alternarColisiones = true;
      if (evento.code === 'KeyT') alternarTecho = true;
    }
    pulsadas.add(evento.code);
  };
  const alSubir = (evento) => pulsadas.delete(evento.code);
  const alPerderFoco = () => pulsadas.clear();

  objetivo.addEventListener('keydown', alBajar);
  objetivo.addEventListener('keyup', alSubir);
  objetivo.addEventListener('blur', alPerderFoco);

  const eje = (positiva, negativa) => (pulsadas.has(positiva) ? 1 : 0) - (pulsadas.has(negativa) ? 1 : 0);

  return {
    // Las acciones de un solo disparo (interactuar, alternar...) valen true una única lectura.
    leer() {
      const acciones = accionesVacias();
      acciones.avanzar = eje('KeyW', 'KeyS');
      acciones.lateral = eje('KeyD', 'KeyA');
      acciones.girar = eje('ArrowLeft', 'ArrowRight');
      acciones.interactuar = interactuar;
      acciones.alternarColisiones = alternarColisiones;
      acciones.alternarTecho = alternarTecho;
      interactuar = false;
      alternarColisiones = false;
      alternarTecho = false;
      return acciones;
    },
    destruir() {
      objetivo.removeEventListener('keydown', alBajar);
      objetivo.removeEventListener('keyup', alSubir);
      objetivo.removeEventListener('blur', alPerderFoco);
    }
  };
}

import assert from 'node:assert/strict';
import test from 'node:test';
import { accionesVacias } from '../../src/acciones.js';
import { crearTeclado } from '../../src/entrada/teclado.js';
import { pulsar } from '../ayudas/falsos.js';

function banco() {
  const objetivo = new EventTarget();
  return { objetivo, teclado: crearTeclado(objetivo) };
}

test('sin teclas pulsadas todo vale cero', () => {
  assert.deepEqual(banco().teclado.leer(), accionesVacias());
});

test('W A S D se convierten en avanzar y lateral', () => {
  const { objetivo, teclado } = banco();
  pulsar(objetivo, 'keydown', 'KeyW');
  assert.equal(teclado.leer().avanzar, 1);
  pulsar(objetivo, 'keydown', 'KeyS');
  assert.equal(teclado.leer().avanzar, 0, 'W y S a la vez se anulan');
  pulsar(objetivo, 'keyup', 'KeyW');
  assert.equal(teclado.leer().avanzar, -1);

  pulsar(objetivo, 'keydown', 'KeyD');
  assert.equal(teclado.leer().lateral, 1);
  pulsar(objetivo, 'keydown', 'KeyA');
  pulsar(objetivo, 'keyup', 'KeyD');
  assert.equal(teclado.leer().lateral, -1);
});

test('la flecha izquierda gira hacia la izquierda (+1) y la derecha hacia la derecha (-1)', () => {
  const { objetivo, teclado } = banco();
  pulsar(objetivo, 'keydown', 'ArrowLeft');
  assert.equal(teclado.leer().girar, 1);
  pulsar(objetivo, 'keyup', 'ArrowLeft');
  pulsar(objetivo, 'keydown', 'ArrowRight');
  assert.equal(teclado.leer().girar, -1);
});

test('E, C y T son acciones de un solo disparo que ignoran la repetición de teclado', () => {
  const { objetivo, teclado } = banco();
  pulsar(objetivo, 'keydown', 'KeyE');
  pulsar(objetivo, 'keydown', 'KeyC');
  pulsar(objetivo, 'keydown', 'KeyT');
  let acciones = teclado.leer();
  assert.equal(acciones.interactuar, true);
  assert.equal(acciones.alternarColisiones, true);
  assert.equal(acciones.alternarTecho, true);

  acciones = teclado.leer();
  assert.equal(acciones.interactuar, false);
  assert.equal(acciones.alternarColisiones, false);
  assert.equal(acciones.alternarTecho, false);

  pulsar(objetivo, 'keydown', 'KeyE', { repeat: true });
  assert.equal(teclado.leer().interactuar, false);
});

test('perder el foco suelta todas las teclas', () => {
  const { objetivo, teclado } = banco();
  pulsar(objetivo, 'keydown', 'KeyW');
  pulsar(objetivo, 'keydown', 'ArrowLeft');
  objetivo.dispatchEvent(new Event('blur'));
  assert.deepEqual(teclado.leer(), accionesVacias());
});

test('las flechas no desplazan la página pero las letras no se bloquean', () => {
  const { objetivo } = banco();
  assert.equal(pulsar(objetivo, 'keydown', 'ArrowLeft').defaultPrevented, true);
  assert.equal(pulsar(objetivo, 'keydown', 'Space').defaultPrevented, true);
  assert.equal(pulsar(objetivo, 'keydown', 'KeyW').defaultPrevented, false);
});

test('destruir deja de escuchar', () => {
  const { objetivo, teclado } = banco();
  teclado.destruir();
  pulsar(objetivo, 'keydown', 'KeyW');
  assert.equal(teclado.leer().avanzar, 0);
});

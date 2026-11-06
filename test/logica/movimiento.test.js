import assert from 'node:assert/strict';
import test from 'node:test';
import { accionesVacias } from '../../src/acciones.js';
import { VELOCIDAD, VELOCIDAD_GIRO } from '../../src/constantes.js';
import { actualizar, crearEstado } from '../../src/logica/index.js';
import { moverJugador } from '../../src/logica/movimiento.js';
import { cargarNivel } from '../../src/nivel/formato.js';
import { casiIgual, colocar, crearJuegoDe } from '../ayudas/nivel.js';

// Campo abierto: sin muros, el jugador empieza en (2, 2) mirando hacia -z.
function campoAbierto() {
  const modelo = cargarNivel({ layout: [[0, 0], [0, 0]] });
  return { modelo, estado: crearEstado(modelo) };
}

function con(cambios) {
  return { ...accionesVacias(), ...cambios };
}

test('empieza en el inicio del modelo', () => {
  const { estado } = campoAbierto();
  assert.deepEqual(estado.jugador, { x: 2, z: 2, yaw: 0 });
});

test('avanzar con yaw 0 va hacia -z', () => {
  const { modelo, estado } = campoAbierto();
  moverJugador(modelo, estado, con({ avanzar: 1 }), 0.5);
  assert.ok(casiIgual(estado.jugador.x, 2));
  assert.ok(casiIgual(estado.jugador.z, 2 - VELOCIDAD * 0.5));
});

test('retroceder va hacia +z y el lateral positivo hacia +x', () => {
  const { modelo, estado } = campoAbierto();
  moverJugador(modelo, estado, con({ avanzar: -1 }), 0.5);
  assert.ok(casiIgual(estado.jugador.z, 2 + VELOCIDAD * 0.5));
  colocar(estado, 2, 2);
  moverJugador(modelo, estado, con({ lateral: 1 }), 0.5);
  assert.ok(casiIgual(estado.jugador.x, 2 + VELOCIDAD * 0.5));
  assert.ok(casiIgual(estado.jugador.z, 2));
});

test('girar positivo gira hacia la izquierda y aumenta el yaw', () => {
  const { modelo, estado } = campoAbierto();
  moverJugador(modelo, estado, con({ girar: 1 }), 0.5);
  assert.ok(casiIgual(estado.jugador.yaw, VELOCIDAD_GIRO * 0.5));
  moverJugador(modelo, estado, con({ girar: -1 }), 0.5);
  assert.ok(casiIgual(estado.jugador.yaw, 0));
});

test('con yaw de un cuarto de vuelta, avanzar va hacia -x', () => {
  const { modelo, estado } = campoAbierto();
  colocar(estado, 2, 2, Math.PI / 2);
  moverJugador(modelo, estado, con({ avanzar: 1 }), 0.5);
  assert.ok(casiIgual(estado.jugador.x, 2 - VELOCIDAD * 0.5));
  assert.ok(casiIgual(estado.jugador.z, 2));
});

test('en diagonal no se va más rápido', () => {
  const { modelo, estado } = campoAbierto();
  moverJugador(modelo, estado, con({ avanzar: 1, lateral: 1 }), 0.5);
  const recorrido = Math.hypot(estado.jugador.x - 2, estado.jugador.z - 2);
  assert.ok(casiIgual(recorrido, VELOCIDAD * 0.5));
});

test('sin acciones no se mueve', () => {
  const { modelo, estado } = campoAbierto();
  moverJugador(modelo, estado, accionesVacias(), 0.5);
  assert.deepEqual(estado.jugador, { x: 2, z: 2, yaw: 0 });
});

test('las colisiones detienen al jugador y se pueden desactivar', () => {
  const { modelo, estado } = crearJuegoDe();
  for (let i = 0; i < 40; i++) actualizar(modelo, estado, con({ avanzar: 1 }), 0.05);
  assert.ok(estado.jugador.z >= 12.475 - 1e-6 && estado.jugador.z < 12.6, `z = ${estado.jugador.z}`);

  actualizar(modelo, estado, con({ alternarColisiones: true }), 0.05);
  assert.equal(estado.opciones.colisiones, false);
  for (let i = 0; i < 20; i++) actualizar(modelo, estado, con({ avanzar: 1 }), 0.05);
  assert.ok(estado.jugador.z < 12, 'sin colisiones atraviesa la puerta cerrada');

  actualizar(modelo, estado, con({ alternarColisiones: true }), 0.05);
  assert.equal(estado.opciones.colisiones, true);
});

test('actualizar sin interacción no devuelve eventos', () => {
  const { modelo, estado } = crearJuegoDe();
  assert.deepEqual(actualizar(modelo, estado, accionesVacias(), 0.05), []);
});

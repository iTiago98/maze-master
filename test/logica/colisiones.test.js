import assert from 'node:assert/strict';
import test from 'node:test';
import { resolverColisiones, segmentosBloqueantes } from '../../src/logica/colisiones.js';
import { casiIgual, colocar, crearJuegoDe } from '../ayudas/nivel.js';

const MINIMA = 0.4 + 0.15 / 2; // RADIO_JUGADOR + GROSOR / 2

function resolver({ modelo, estado }) {
  resolverColisiones(estado.jugador, segmentosBloqueantes(modelo, estado));
}

test('una puerta cerrada bloquea el paso', () => {
  const juego = crearJuegoDe();
  colocar(juego.estado, 10, 12.2);
  resolver(juego);
  assert.ok(casiIgual(juego.estado.jugador.x, 10));
  assert.ok(casiIgual(juego.estado.jugador.z, 12 + MINIMA));
});

test('una puerta a medio abrir sigue bloqueando', () => {
  const juego = crearJuegoDe();
  juego.estado.muros['2,3,h'].abierta = 0.5;
  colocar(juego.estado, 10, 12);
  resolver(juego);
  assert.ok(Math.abs(juego.estado.jugador.z - 12) >= MINIMA - 1e-9);
});

test('una puerta abierta deja pasar por el centro del hueco', () => {
  const juego = crearJuegoDe();
  juego.estado.muros['2,3,h'].abierta = 1;
  colocar(juego.estado, 10, 12);
  resolver(juego);
  assert.deepEqual([juego.estado.jugador.x, juego.estado.jugador.z], [10, 12]);
});

test('con la puerta abierta, los tramos de muro junto al hueco siguen bloqueando', () => {
  const juego = crearJuegoDe();
  juego.estado.muros['2,3,h'].abierta = 1;
  colocar(juego.estado, 9.2, 12);
  resolver(juego);
  assert.ok(juego.estado.jugador.x >= 9 + MINIMA - 1e-9);
});

test('una puerta abierta aporta dos segmentos en vez de uno', () => {
  const juego = crearJuegoDe();
  assert.equal(segmentosBloqueantes(juego.modelo, juego.estado).length, 41);
  juego.estado.muros['2,3,h'].abierta = 1;
  assert.equal(segmentosBloqueantes(juego.modelo, juego.estado).length, 42);
});

test('estando justo encima de un muro, se empuja en su perpendicular', () => {
  const jugador = { x: 2, z: 0 };
  resolverColisiones(jugador, [[0, 0, 4, 0]]);
  assert.ok(casiIgual(jugador.x, 2));
  assert.ok(casiIgual(jugador.z, MINIMA));
});

test('el jugador se aparta de los extremos de un muro como de un círculo', () => {
  const jugador = { x: 4.1, z: 0.1 };
  resolverColisiones(jugador, [[0, 0, 4, 0]]);
  assert.ok(Math.hypot(jugador.x - 4, jugador.z - 0) >= MINIMA - 1e-9);
});

test('lejos de los muros no se mueve', () => {
  const jugador = { x: 2, z: 2 };
  resolverColisiones(jugador, [[0, 0, 4, 0]]);
  assert.deepEqual(jugador, { x: 2, z: 2 });
});

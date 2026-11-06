import assert from 'node:assert/strict';
import test from 'node:test';
import { agregar, crearInventario, quitar, tiene } from '../../src/logica/inventario.js';

test('el inventario empieza vacío', () => {
  assert.deepEqual(crearInventario(), []);
});

test('agregar, consultar y quitar objetos', () => {
  const inventario = crearInventario();
  assert.equal(tiene(inventario, 'llave:roja'), false);
  agregar(inventario, 'llave:roja');
  assert.equal(tiene(inventario, 'llave:roja'), true);
  assert.equal(tiene(inventario, 'llave:azul'), false);
  quitar(inventario, 'llave:roja');
  assert.equal(tiene(inventario, 'llave:roja'), false);
});

test('no se duplican los objetos y quitar uno ausente no hace nada', () => {
  const inventario = crearInventario();
  agregar(inventario, 'llave:roja');
  agregar(inventario, 'llave:roja');
  assert.deepEqual(inventario, ['llave:roja']);
  quitar(inventario, 'llave:azul');
  assert.deepEqual(inventario, ['llave:roja']);
});

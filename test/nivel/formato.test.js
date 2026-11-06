import assert from 'node:assert/strict';
import test from 'node:test';
import { CELDA, VERSION_FORMATO } from '../../src/constantes.js';
import { cargarNivel } from '../../src/nivel/formato.js';
import { copiaEjemplo, datosEjemplo } from '../ayudas/nivel.js';

test('el nivel de ejemplo produce 41 muros, 3 de ellos puertas', () => {
  const modelo = cargarNivel(datosEjemplo);
  assert.equal(modelo.muros.length, 41);
  assert.deepEqual(
    modelo.muros.filter((m) => m.tipo === 'puerta').map((m) => m.id).sort(),
    ['2,3,h', '4,4,v', '7,3,h']
  );
  assert.deepEqual(modelo.avisos, []);
  assert.equal(modelo.version, 2);
});

test('el tamaño del plano sale de la matriz', () => {
  const modelo = cargarNivel(datosEjemplo);
  assert.equal(modelo.columnas, 9);
  assert.equal(modelo.filas, 9);
  assert.deepEqual(modelo.limites, { ancho: 8 * CELDA, fondo: 8 * CELDA });
});

test('los identificadores y los extremos de los muros son coherentes con la rejilla', () => {
  const modelo = cargarNivel(datosEjemplo);
  const ids = new Set();
  for (const muro of modelo.muros) {
    assert.ok(!ids.has(muro.id), `id repetido ${muro.id}`);
    ids.add(muro.id);
    const [x, y, sentido] = muro.id.split(',');
    assert.deepEqual(muro.a, { x: Number(x) * CELDA, z: Number(y) * CELDA });
    assert.equal(muro.horizontal, sentido === 'h');
    assert.deepEqual(muro.dir, muro.horizontal ? { x: 1, z: 0 } : { x: 0, z: 1 });
    assert.deepEqual(muro.b, { x: muro.a.x + muro.dir.x * CELDA, z: muro.a.z + muro.dir.z * CELDA });
  }
  const puerta = modelo.muros.find((m) => m.id === '2,3,h');
  assert.deepEqual(puerta.a, { x: 8, z: 12 });
  assert.deepEqual(puerta.b, { x: 12, z: 12 });
});

test('el inicio se convierte de celdas a unidades de mundo y de grados a radianes', () => {
  assert.deepEqual(cargarNivel(datosEjemplo).inicio, { x: 10, z: 18, yaw: 0 });
  const datos = copiaEjemplo();
  datos.inicio = { x: 1, y: 2, angulo: 90 };
  const { inicio } = cargarNivel(datos);
  assert.equal(inicio.x, 4);
  assert.equal(inicio.z, 8);
  assert.ok(Math.abs(inicio.yaw - Math.PI / 2) < 1e-12);
});

test('sin "inicio" se usa la celda libre más cercana al centro', () => {
  const { inicio } = cargarNivel({ layout: datosEjemplo.layout });
  assert.deepEqual(inicio, { x: 4.5 * CELDA, z: 2.5 * CELDA, yaw: 0 });
});

test('las anotaciones cambian el tipo y guardan el resto como propiedades', () => {
  const datos = copiaEjemplo();
  datos.muros['2,3,h'] = { tipo: 'puerta', llave: 'roja', detalle: { a: 1 } };
  const modelo = cargarNivel(datos);
  const puerta = modelo.muros.find((m) => m.id === '2,3,h');
  assert.equal(puerta.tipo, 'puerta');
  assert.deepEqual(puerta.props, { llave: 'roja', detalle: { a: 1 } });

  puerta.props.detalle.a = 99;
  assert.equal(datos.muros['2,3,h'].detalle.a, 1, 'el modelo no comparte referencias con el JSON');

  const sinAnotar = modelo.muros.find((m) => m.id === '0,0,h');
  assert.equal(sinAnotar.tipo, 'pared');
  assert.deepEqual(sinAnotar.props, {});
});

test('una anotación sin tipo es una pared con propiedades', () => {
  const datos = copiaEjemplo();
  datos.muros = { '0,0,h': { color: 'azul' } };
  const muro = cargarNivel(datos).muros.find((m) => m.id === '0,0,h');
  assert.equal(muro.tipo, 'pared');
  assert.deepEqual(muro.props, { color: 'azul' });
});

test('no modifica el JSON de entrada', () => {
  const datos = copiaEjemplo();
  const antes = JSON.stringify(datos);
  cargarNivel(datos);
  assert.equal(JSON.stringify(datos), antes);
});

test('un muro que sale de la matriz se ignora con un aviso', () => {
  const modelo = cargarNivel({ layout: [[3]] });
  assert.equal(modelo.muros.length, 0);
  assert.equal(modelo.avisos.length, 2);
  assert.match(modelo.avisos[0], /horizontal fuera de la matriz/);
  assert.match(modelo.avisos[1], /vertical fuera de la matriz/);
});

test('un tipo desconocido avisa solo si se pasan los tipos conocidos', () => {
  const datos = copiaEjemplo();
  datos.muros['0,0,h'] = { tipo: 'rareza' };
  assert.deepEqual(cargarNivel(datos).avisos, []);

  const modelo = cargarNivel(datos, { tiposConocidos: ['pared', 'puerta'] });
  assert.equal(modelo.avisos.length, 1);
  assert.match(modelo.avisos[0], /rareza/);
  assert.equal(modelo.muros.find((m) => m.id === '0,0,h').tipo, 'rareza');

  assert.deepEqual(cargarNivel(datosEjemplo, { tiposConocidos: ['pared', 'puerta'] }).avisos, []);
});

test('versión: por defecto 1, y avisa si es más nueva que la que entiende el visor', () => {
  assert.equal(cargarNivel({ layout: [[0, 0], [0, 0]] }).version, 1);
  const modelo = cargarNivel({ version: VERSION_FORMATO + 1, layout: [[0, 0], [0, 0]], algoNuevo: true });
  assert.equal(modelo.version, VERSION_FORMATO + 1);
  assert.match(modelo.avisos[0], new RegExp(`versión ${VERSION_FORMATO + 1}`));
});

test('las claves desconocidas se ignoran', () => {
  const datos = { ...copiaEjemplo(), futuro: { cosa: 1 } };
  assert.equal(cargarNivel(datos).muros.length, 41);
});

test('las cosas se convierten a unidades de mundo', () => {
  const datos = copiaEjemplo();
  datos.cosas = [{ tipo: 'llave', color: 'roja', x: 2.5, y: 0.5 }];
  assert.deepEqual(cargarNivel(datos).cosas, [
    { id: 'cosa-0', tipo: 'llave', x: 10, z: 2, props: { color: 'roja' } }
  ]);
  assert.deepEqual(cargarNivel(datosEjemplo).cosas, []);
});

test('los JSON no válidos lanzan errores con un mensaje legible', () => {
  const con = (cambios) => ({ ...copiaEjemplo(), ...cambios });
  const casos = [
    [null, /objeto JSON/],
    [[], /objeto JSON/],
    [{}, /layout/],
    [{ layout: [] }, /layout/],
    [{ layout: [[]] }, /layout/],
    [{ layout: [[0, 0], [0]] }, /fila 1 no tiene 2 columnas/],
    [{ layout: [[0, 7]] }, /Valor inválido en fila 0, columna 1/],
    [{ layout: [['a']] }, /Valor inválido/],
    [con({ muros: [] }), /"muros" debe ser un objeto/],
    [con({ muros: { '8,8,h': { tipo: 'puerta' } } }), /"8,8,h" no existe/],
    [con({ muros: { '0,0,h': 'puerta' } }), /debe ser un objeto/],
    [con({ muros: { '0,0,h': { tipo: 3 } } }), /"tipo"/],
    [con({ muros: { '0,0,h': { tipo: '' } } }), /"tipo"/],
    [con({ inicio: { x: 'a', y: 1 } }), /inicio/],
    [con({ inicio: 5 }), /inicio/],
    [con({ inicio: { x: 1, y: 1, angulo: 'norte' } }), /angulo/],
    [con({ cosas: {} }), /"cosas" debe ser una lista/],
    [con({ cosas: [{ tipo: 'llave', x: 1 }] }), /La cosa 0/],
    [con({ version: 0 }), /version/],
    [con({ version: '2' }), /version/],
    [con({ version: 1.5 }), /version/]
  ];
  for (const [datos, patron] of casos) {
    assert.throws(() => cargarNivel(datos), patron, `con ${JSON.stringify(datos)}`);
  }
});

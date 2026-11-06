// Fijan las formas descritas en docs/CONTRATOS.md. Si fallan, o has cambiado un contrato
// (PR "[contrato]", y actualiza el documento) o has roto uno sin querer.

import assert from 'node:assert/strict';
import test from 'node:test';
import { accionesVacias } from '../../src/acciones.js';
import { CELDA, VERSION_FORMATO } from '../../src/constantes.js';
import { crearTeclado } from '../../src/entrada/teclado.js';
import * as logica from '../../src/logica/index.js';
import * as inventario from '../../src/logica/inventario.js';
import { METODOS_DE_TIPO, TIPOS_REGISTRADOS } from '../../src/logica/tipos/index.js';
import { cargarNivel } from '../../src/nivel/formato.js';
import { crearAplicacion } from '../../src/aplicacion.js';
import { crearEscena } from '../../src/render/escena.js';
import { crearHud, textoDeEvento } from '../../src/render/hud.js';
import { construirMapa } from '../../src/render/mapa.js';
import { nombresDeTiposDeRender, TIPOS_DE_RENDER } from '../../src/render/tipos/index.js';
import { copiaEjemplo, crearJuegoDe, datosEjemplo } from '../ayudas/nivel.js';

const claves = (objeto) => Object.keys(objeto).sort();

test('forma del modelo de nivel', () => {
  const datos = copiaEjemplo();
  datos.cosas = [{ tipo: 'llave', color: 'roja', x: 1.5, y: 1.5 }];
  const { modelo } = crearJuegoDe(datos);

  assert.deepEqual(claves(modelo), ['avisos', 'columnas', 'cosas', 'filas', 'inicio', 'limites', 'muros', 'version']);
  assert.deepEqual(claves(modelo.inicio), ['x', 'yaw', 'z']);
  assert.deepEqual(claves(modelo.limites), ['ancho', 'fondo']);
  assert.deepEqual(claves(modelo.cosas[0]), ['id', 'props', 'tipo', 'x', 'z']);

  for (const muro of modelo.muros) {
    assert.deepEqual(claves(muro), ['a', 'b', 'dir', 'horizontal', 'id', 'props', 'tipo']);
    assert.deepEqual(claves(muro.a), ['x', 'z']);
    assert.deepEqual(claves(muro.b), ['x', 'z']);
    assert.deepEqual(claves(muro.dir), ['x', 'z']);
    assert.match(muro.id, /^\d+,\d+,[hv]$/);
    assert.equal(Math.hypot(muro.dir.x, muro.dir.z), 1);
    assert.deepEqual(muro.b, { x: muro.a.x + muro.dir.x * CELDA, z: muro.a.z + muro.dir.z * CELDA });
  }
});

test('forma del estado del juego', () => {
  const { estado } = crearJuegoDe();
  assert.deepEqual(claves(estado), ['inventario', 'jugador', 'muros', 'opciones']);
  assert.deepEqual(claves(estado.jugador), ['x', 'yaw', 'z']);
  assert.deepEqual(claves(estado.opciones), ['colisiones']);
  assert.ok(Array.isArray(estado.inventario));
  assert.deepEqual(claves(estado.muros), ['2,3,h', '4,4,v', '7,3,h'], 'solo los muros con estado');
  for (const est of Object.values(estado.muros)) assert.deepEqual(claves(est), ['abierta', 'abriendo']);
});

test('el modelo y el estado son datos puros: se pueden serializar sin perder nada', () => {
  const { modelo, estado } = crearJuegoDe();
  assert.deepEqual(JSON.parse(JSON.stringify(modelo)), modelo);
  assert.deepEqual(JSON.parse(JSON.stringify(estado)), estado);
});

test('jugar no modifica el modelo', () => {
  const { modelo, estado } = crearJuegoDe();
  const antes = structuredClone(modelo);
  const movimientos = [
    { avanzar: 1 },
    { lateral: -1, girar: 1 },
    { interactuar: true },
    { avanzar: -1, girar: -1 },
    { alternarColisiones: true, avanzar: 1 }
  ];
  for (let i = 0; i < 200; i++) {
    logica.actualizar(modelo, estado, { ...accionesVacias(), ...movimientos[i % movimientos.length] }, 0.05);
  }
  assert.deepEqual(modelo, antes);
});

test('forma de las acciones', () => {
  const esperadas = ['alternarColisiones', 'alternarTecho', 'avanzar', 'girar', 'interactuar', 'lateral'];
  assert.deepEqual(claves(accionesVacias()), esperadas);
  assert.deepEqual(claves(crearTeclado(new EventTarget()).leer()), esperadas);
});

test('los eventos tienen un tipo y el identificador del muro', () => {
  const { modelo, estado } = crearJuegoDe();
  Object.assign(estado.jugador, { x: 10, z: 14, yaw: 0 });
  const eventos = logica.actualizar(modelo, estado, { ...accionesVacias(), interactuar: true }, 0.05);
  assert.ok(eventos.length > 0);
  for (const evento of eventos) {
    assert.equal(typeof evento.tipo, 'string');
    assert.equal(typeof evento.id, 'string');
  }
});

test('API pública de cada área', () => {
  for (const funcion of [
    cargarNivel,
    logica.crearEstado,
    logica.actualizar,
    logica.consultarInteraccion,
    logica.nombresDeTipos,
    inventario.crearInventario,
    inventario.tiene,
    inventario.agregar,
    inventario.quitar,
    crearTeclado,
    crearEscena,
    construirMapa,
    crearHud,
    textoDeEvento,
    crearAplicacion
  ]) {
    assert.equal(typeof funcion, 'function');
  }
});

test('el nivel de ejemplo usa la versión actual del formato, carga sin avisos y solo tipos registrados', () => {
  assert.equal(datosEjemplo.version, VERSION_FORMATO);
  const modelo = cargarNivel(datosEjemplo, { tiposConocidos: logica.nombresDeTipos() });
  assert.deepEqual(modelo.avisos, []);
});

test('cada tipo de muro tiene su pieza de lógica y su pieza de render', () => {
  assert.deepEqual([...logica.nombresDeTipos()].sort(), [...nombresDeTiposDeRender()].sort());
});

test('los tipos de muro solo definen métodos de la interfaz', () => {
  const permitidosLogica = new Set(['nombre', ...METODOS_DE_TIPO]);
  for (const tipo of TIPOS_REGISTRADOS) {
    assert.equal(typeof tipo.nombre, 'string');
    for (const clave of Object.keys(tipo)) {
      assert.ok(permitidosLogica.has(clave), `lógica: "${tipo.nombre}" define "${clave}", que no está en la interfaz`);
    }
  }
  const permitidosRender = new Set(['nombre', 'construir']);
  for (const tipo of TIPOS_DE_RENDER) {
    assert.equal(typeof tipo.construir, 'function', `render: "${tipo.nombre}" necesita construir()`);
    for (const clave of Object.keys(tipo)) {
      assert.ok(permitidosRender.has(clave), `render: "${tipo.nombre}" define "${clave}", que no está en la interfaz`);
    }
  }
});

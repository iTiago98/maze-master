import assert from 'node:assert/strict';
import test from 'node:test';
import { PUERTA_ALTO } from '../../src/constantes.js';
import { construirMapa } from '../../src/render/mapa.js';
import { crearThreeFalso } from '../ayudas/falsos.js';
import { copiaEjemplo, crearJuegoDe } from '../ayudas/nivel.js';

const COLOR_PUERTA = 0xb5651d;
const COLOR_TECHO = 0x161a22;

function conColor(mapa, color) {
  return mapa.grupo.children.filter((o) => o.material?.opciones?.color === color);
}

test('el nivel de ejemplo produce 52 mallas: 38 paredes, 3 puertas de 4 piezas, suelo y techo', () => {
  const THREE = crearThreeFalso();
  const { modelo } = crearJuegoDe();
  const mapa = construirMapa(THREE, modelo);
  assert.ok(mapa.grupo instanceof THREE.Group);
  assert.equal(mapa.grupo.children.length, 52);
  assert.equal(conColor(mapa, COLOR_PUERTA).length, 3);
});

test('la hoja de la puerta se recoge hacia arriba al abrirse', () => {
  const THREE = crearThreeFalso();
  const { modelo, estado } = crearJuegoDe();
  const mapa = construirMapa(THREE, modelo);
  const hoja = conColor(mapa, COLOR_PUERTA).find((h) => h.position.x === 10 && h.position.z === 12);
  assert.ok(hoja, 'hoja de la puerta 2,3,h');

  mapa.actualizar(estado);
  assert.equal(hoja.visible, true);
  assert.equal(hoja.scale.y, 1);

  estado.muros['2,3,h'].abierta = 0.5;
  mapa.actualizar(estado);
  assert.equal(hoja.visible, true);
  assert.equal(hoja.scale.y, 0.5);
  assert.equal(hoja.position.y, PUERTA_ALTO - (PUERTA_ALTO * 0.5) / 2);

  estado.muros['2,3,h'].abierta = 1;
  mapa.actualizar(estado);
  assert.equal(hoja.visible, false);

  const otras = conColor(mapa, COLOR_PUERTA).filter((h) => h !== hoja);
  assert.ok(otras.every((h) => h.visible && h.scale.y === 1), 'las otras puertas siguen cerradas');
});

test('el techo se puede alternar y recordar entre mapas', () => {
  const THREE = crearThreeFalso();
  const { modelo } = crearJuegoDe();
  const mapa = construirMapa(THREE, modelo);
  const [techo] = conColor(mapa, COLOR_TECHO);
  assert.equal(mapa.techoVisible, true);
  mapa.alternarTecho();
  assert.equal(techo.visible, false);
  assert.equal(mapa.techoVisible, false);
  mapa.alternarTecho();
  assert.equal(techo.visible, true);

  const sinTecho = construirMapa(THREE, modelo, { techoVisible: false });
  assert.equal(sinTecho.techoVisible, false);
});

test('el suelo y el techo cubren el plano con margen', () => {
  const THREE = crearThreeFalso();
  const { modelo } = crearJuegoDe();
  const mapa = construirMapa(THREE, modelo);
  const [techo] = conColor(mapa, COLOR_TECHO);
  assert.deepEqual(techo.geometry.argumentos, [modelo.limites.ancho + 40, modelo.limites.fondo + 40]);
  assert.equal(techo.position.x, modelo.limites.ancho / 2);
  assert.equal(techo.position.z, modelo.limites.fondo / 2);
});

test('las cajas del mismo tamaño comparten geometría', () => {
  const THREE = crearThreeFalso();
  const { modelo } = crearJuegoDe();
  const mapa = construirMapa(THREE, modelo);
  const distintas = new Set(mapa.grupo.children.map((o) => o.geometry));
  assert.ok(distintas.size <= 12, `${distintas.size} geometrías para ${mapa.grupo.children.length} mallas`);
});

test('liberar descarta geometrías y materiales', () => {
  const THREE = crearThreeFalso();
  const { modelo } = crearJuegoDe();
  const mapa = construirMapa(THREE, modelo);
  mapa.liberar();
  assert.ok(mapa.grupo.children.every((o) => o.geometry.liberada));
  assert.ok(mapa.grupo.children.every((o) => o.material.liberado));
});

test('un tipo de muro desconocido se dibuja como pared', () => {
  const THREE = crearThreeFalso();
  const datos = copiaEjemplo();
  datos.muros['0,0,h'] = { tipo: 'rareza' };
  const { modelo, estado } = crearJuegoDe(datos);
  const mapa = construirMapa(THREE, modelo);
  mapa.actualizar(estado);
  assert.equal(mapa.grupo.children.length, 52);
});

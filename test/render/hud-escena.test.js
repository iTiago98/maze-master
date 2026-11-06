import assert from 'node:assert/strict';
import test from 'node:test';
import { ALTURA_OJOS } from '../../src/constantes.js';
import { crearEscena } from '../../src/render/escena.js';
import { crearHud, textoDeEvento } from '../../src/render/hud.js';
import { crearDocumentoFalso, crearThreeFalso, crearVentanaFalsa } from '../ayudas/falsos.js';

test('el aviso se muestra y se oculta al vencer el temporizador', () => {
  const doc = crearDocumentoFalso();
  const ventana = crearVentanaFalsa();
  const hud = crearHud(doc, ventana);
  hud.mostrarAviso('Hola');
  assert.equal(doc.getElementById('aviso').textContent, 'Hola');
  assert.equal(doc.getElementById('aviso').style.display, 'block');
  assert.equal(ventana.temporizadores.length, 1);
  ventana.temporizadores[0]();
  assert.equal(doc.getElementById('aviso').style.display, 'none');
});

test('la pista se muestra, se oculta y no toca el DOM si no cambia', () => {
  const doc = crearDocumentoFalso();
  const hud = crearHud(doc, crearVentanaFalsa());
  const pista = doc.getElementById('pista');

  hud.mostrarPista('E · abrir puerta');
  assert.equal(pista.textContent, 'E · abrir puerta');
  assert.equal(pista.style.display, 'block');

  pista.style.display = 'centinela';
  hud.mostrarPista('E · abrir puerta');
  assert.equal(pista.style.display, 'centinela', 'mismo texto: no se vuelve a escribir');

  hud.mostrarPista(null);
  assert.equal(pista.style.display, 'none');
});

test('el indicador de colisiones muestra sí o no', () => {
  const doc = crearDocumentoFalso();
  const hud = crearHud(doc, crearVentanaFalsa());
  hud.establecerColisiones(false);
  assert.equal(doc.getElementById('col').textContent, 'no');
  hud.establecerColisiones(true);
  assert.equal(doc.getElementById('col').textContent, 'sí');
});

test('textoDeEvento traduce los eventos que tienen texto y devuelve null para el resto', () => {
  assert.match(textoDeEvento({ tipo: 'puerta-bloqueada', id: '2,3,h', llave: 'roja' }), /llave roja/);
  assert.equal(textoDeEvento({ tipo: 'puerta-abriendo', id: '2,3,h' }), null);
  assert.equal(textoDeEvento({ tipo: 'inventado' }), null);
});

test('la escena añade el lienzo al contenedor y dibuja desde la posición del jugador', () => {
  const THREE = crearThreeFalso();
  const doc = crearDocumentoFalso();
  const ventana = crearVentanaFalsa();
  const vista = crearEscena(THREE, doc.body, ventana);

  assert.deepEqual(doc.body.hijos, [vista.renderer.domElement]);
  assert.equal(vista.escena.children.length, 2, 'dos luces');
  assert.deepEqual(vista.renderer.tamano, [800, 600]);

  vista.dibujar({ x: 3, z: 5, yaw: 1 });
  assert.equal(vista.renderer.dibujos, 1);
  assert.deepEqual(
    [vista.camara.position.x, vista.camara.position.y, vista.camara.position.z],
    [3, ALTURA_OJOS, 5]
  );
  assert.equal(vista.camara.rotation.y, 1);
  assert.equal(vista.renderer.ultimo.camara, vista.camara);
});

test('redimensionar actualiza la cámara y el lienzo', () => {
  const ventana = crearVentanaFalsa();
  const vista = crearEscena(crearThreeFalso(), crearDocumentoFalso().body, ventana);
  ventana.innerWidth = 1000;
  ventana.innerHeight = 500;
  vista.redimensionar();
  assert.equal(vista.camara.aspect, 2);
  assert.deepEqual(vista.renderer.tamano, [1000, 500]);
});

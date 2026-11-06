// La aplicación completa (entrada + lógica + render) con falsos de three, del documento y de la ventana.

import assert from 'node:assert/strict';
import test from 'node:test';
import { crearAplicacion } from '../../src/aplicacion.js';
import { crearDocumentoFalso, crearThreeFalso, crearVentanaFalsa, pulsar } from '../ayudas/falsos.js';
import { copiaEjemplo, datosEjemplo } from '../ayudas/nivel.js';

const COLOR_PUERTA = 0xb5651d;
const COLOR_TECHO = 0x161a22;

function crearBanco(datos = datosEjemplo) {
  const THREE = crearThreeFalso();
  const documento = crearDocumentoFalso();
  const ventana = crearVentanaFalsa();
  let pendiente = null;
  const app = crearAplicacion({
    THREE,
    documento,
    ventana,
    solicitarFrame: (funcion) => {
      pendiente = funcion;
    }
  });
  let reloj = 1000;

  const banco = {
    THREE,
    documento,
    ventana,
    app,
    elemento: (id) => documento.getElementById(id),
    camara: () => app.vista.camara,
    // Ejecuta el fotograma pendiente, como haría requestAnimationFrame.
    fotograma(milisegundos = 50) {
      assert.ok(pendiente, 'no hay fotograma pendiente');
      const funcion = pendiente;
      pendiente = null;
      reloj += milisegundos;
      funcion(reloj);
    },
    fotogramas(n) {
      for (let i = 0; i < n; i++) banco.fotograma();
    },
    mantener(code, fotogramas) {
      pulsar(ventana, 'keydown', code);
      banco.fotogramas(fotogramas);
      pulsar(ventana, 'keyup', code);
      banco.fotograma();
    },
    tocar(code) {
      pulsar(ventana, 'keydown', code);
      pulsar(ventana, 'keyup', code);
      banco.fotograma();
    },
    malla: (color) =>
      app.vista.escena.children
        .find((o) => o instanceof THREE.Group)
        .children.filter((o) => o.material?.opciones?.color === color),
    async soltarArchivo(texto) {
      const evento = Object.assign(new Event('drop', { cancelable: true }), {
        dataTransfer: { files: [{ text: async () => texto }] }
      });
      ventana.dispatchEvent(evento);
      await new Promise((resolver) => setImmediate(resolver));
    }
  };

  app.cargar(datos);
  app.iniciar();
  banco.fotograma();
  return banco;
}

test('arranca en el inicio del nivel y dibuja', () => {
  const b = crearBanco();
  assert.equal(b.app.vista.renderer.dibujos, 1);
  assert.deepEqual(
    [b.camara().position.x, b.camara().position.y, b.camara().position.z, b.camara().rotation.y],
    [10, 1.6, 18, 0]
  );
  assert.equal(b.malla(COLOR_PUERTA).length, 3);
  assert.equal(b.elemento('col').textContent, 'sí');
});

test('recorrido completo: avanzar, ver la pista, chocar, abrir la puerta con E y atravesarla', () => {
  const b = crearBanco();
  b.mantener('KeyW', 20);
  assert.ok(Math.abs(b.camara().position.z - 14) < 0.05, `z = ${b.camara().position.z}`);
  assert.equal(b.elemento('pista').style.display, 'block');
  assert.equal(b.elemento('pista').textContent, 'E · abrir puerta');

  b.mantener('KeyW', 20);
  assert.ok(b.camara().position.z >= 12.4, `la puerta cerrada debe bloquear: z = ${b.camara().position.z}`);

  const hoja = b.malla(COLOR_PUERTA).find((h) => h.position.x === 10 && h.position.z === 12);
  b.tocar('KeyE');
  assert.ok(hoja.visible && hoja.scale.y < 1, 'la hoja se está abriendo');
  b.fotogramas(25);
  assert.equal(hoja.visible, false);
  assert.equal(b.elemento('pista').style.display, 'none');
  assert.ok(b.malla(COLOR_PUERTA).filter((h) => h !== hoja).every((h) => h.visible), 'las otras siguen cerradas');

  b.mantener('KeyW', 30);
  assert.ok(b.camara().position.z < 11, `debería haber atravesado la puerta: z = ${b.camara().position.z}`);
});

test('las flechas giran la cámara', () => {
  const b = crearBanco();
  b.mantener('ArrowLeft', 10);
  assert.ok(b.camara().rotation.y > 0.9, `yaw = ${b.camara().rotation.y}`);
  b.mantener('ArrowRight', 20);
  assert.ok(b.camara().rotation.y < -0.9, `yaw = ${b.camara().rotation.y}`);
});

test('una puerta con llave avisa de que falta la llave', () => {
  const datos = copiaEjemplo();
  datos.muros['2,3,h'].llave = 'roja';
  const b = crearBanco(datos);
  b.mantener('KeyW', 20);
  assert.equal(b.elemento('pista').textContent, 'Necesitas la llave roja');
  b.tocar('KeyE');
  assert.match(b.elemento('aviso').textContent, /llave roja/);
  assert.equal(b.app.estado.muros['2,3,h'].abriendo, false);
});

test('C alterna las colisiones y T el techo, y ambos se recuerdan al cambiar de nivel', () => {
  const b = crearBanco();
  b.tocar('KeyC');
  b.tocar('KeyT');
  assert.equal(b.app.estado.opciones.colisiones, false);
  assert.equal(b.elemento('col').textContent, 'no');
  assert.equal(b.malla(COLOR_TECHO)[0].visible, false);

  b.app.cargar(datosEjemplo);
  assert.equal(b.app.estado.opciones.colisiones, false);
  assert.equal(b.malla(COLOR_TECHO)[0].visible, false);
});

test('cargar otro nivel sustituye el mapa anterior y libera sus recursos', () => {
  const b = crearBanco();
  const viejo = b.app.vista.escena.children.find((o) => o instanceof b.THREE.Group);
  b.app.cargar({ layout: [[0, 0], [0, 0]] });
  const grupos = b.app.vista.escena.children.filter((o) => o instanceof b.THREE.Group);
  assert.equal(grupos.length, 1);
  assert.notEqual(grupos[0], viejo);
  assert.ok(viejo.children.every((o) => o.geometry.liberada));
  assert.equal(b.app.modelo.muros.length, 0);
});

test('un nivel inválido avisa y deja el anterior intacto', () => {
  const b = crearBanco();
  const modelo = b.app.modelo;
  b.app.cargarSeguro({ layout: [] });
  assert.match(b.elemento('aviso').textContent, /No se pudo cargar el nivel/);
  assert.equal(b.app.modelo, modelo);
  assert.equal(b.app.vista.escena.children.filter((o) => o instanceof b.THREE.Group).length, 1);
  b.fotograma();
});

test('los avisos del nivel se muestran al cargarlo', () => {
  const datos = copiaEjemplo();
  datos.muros['0,0,h'] = { tipo: 'rareza' };
  const b = crearBanco(datos);
  assert.match(b.elemento('aviso').textContent, /rareza/);
});

test('arrastrar un .json lo carga, y uno roto avisa sin romper nada', async () => {
  const b = crearBanco();
  await b.soltarArchivo(JSON.stringify({ layout: [[1, 0, 0], [0, 0, 0]] }));
  assert.equal(b.app.modelo.muros.length, 1);

  const modelo = b.app.modelo;
  await b.soltarArchivo('{esto no es json');
  assert.match(b.elemento('aviso').textContent, /No se pudo cargar el nivel/);
  assert.equal(b.app.modelo, modelo);
});

test('al redimensionar la ventana se ajusta el lienzo', () => {
  const b = crearBanco();
  b.ventana.innerWidth = 1000;
  b.ventana.innerHeight = 500;
  b.ventana.dispatchEvent(new Event('resize'));
  assert.deepEqual(b.app.vista.renderer.tamano, [1000, 500]);
});

test('un salto largo de tiempo no teletransporta al jugador', () => {
  const b = crearBanco();
  pulsar(b.ventana, 'keydown', 'KeyW');
  b.fotograma(60_000);
  assert.ok(b.camara().position.z > 17.5, `z = ${b.camara().position.z}`);
});

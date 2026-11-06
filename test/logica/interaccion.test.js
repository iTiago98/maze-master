import assert from 'node:assert/strict';
import test from 'node:test';
import { accionesVacias } from '../../src/acciones.js';
import { CELDA, PUERTA_DURACION } from '../../src/constantes.js';
import { actualizar, consultarInteraccion } from '../../src/logica/index.js';
import { agregar } from '../../src/logica/inventario.js';
import { colocar, copiaEjemplo, crearJuegoDe } from '../ayudas/nivel.js';

const INTERACTUAR = { ...accionesVacias(), interactuar: true };

test('apunta a la puerta cuando está cerca y delante', () => {
  const { modelo, estado } = crearJuegoDe();
  colocar(estado, 10, 14, 0);
  assert.deepEqual(consultarInteraccion(modelo, estado), { id: '2,3,h', texto: 'E · abrir puerta' });
});

test('no apunta si el jugador le da la espalda, está lejos o mira a otro lado', () => {
  const { modelo, estado } = crearJuegoDe();
  colocar(estado, 10, 14, Math.PI);
  assert.equal(consultarInteraccion(modelo, estado), null);
  colocar(estado, 10, 18, 0);
  assert.equal(consultarInteraccion(modelo, estado), null);
  colocar(estado, 10, 14, Math.PI / 2);
  assert.equal(consultarInteraccion(modelo, estado), null);
});

test('interactuar abre la puerta y deja de poder apuntarse', () => {
  const { modelo, estado } = crearJuegoDe();
  colocar(estado, 10, 14, 0);

  const eventos = actualizar(modelo, estado, INTERACTUAR, 0.05);
  assert.deepEqual(eventos, [{ tipo: 'puerta-abriendo', id: '2,3,h' }]);
  assert.equal(estado.muros['2,3,h'].abriendo, true);
  assert.equal(consultarInteraccion(modelo, estado), null);

  const pasos = Math.ceil(PUERTA_DURACION / 0.05) + 2;
  for (let i = 0; i < pasos; i++) actualizar(modelo, estado, accionesVacias(), 0.05);
  assert.equal(estado.muros['2,3,h'].abierta, 1);

  assert.deepEqual(actualizar(modelo, estado, INTERACTUAR, 0.05), []);
});

test('interactuar sin nada delante no hace nada', () => {
  const { modelo, estado } = crearJuegoDe();
  assert.deepEqual(actualizar(modelo, estado, INTERACTUAR, 0.05), []);
  assert.ok(Object.values(estado.muros).every((m) => !m.abriendo));
});

test('una puerta con llave no se abre sin ella', () => {
  const datos = copiaEjemplo();
  datos.muros['2,3,h'].llave = 'roja';
  const { modelo, estado } = crearJuegoDe(datos);
  colocar(estado, 10, 14, 0);

  assert.equal(consultarInteraccion(modelo, estado).texto, 'Necesitas la llave roja');
  assert.deepEqual(actualizar(modelo, estado, INTERACTUAR, 0.05), [
    { tipo: 'puerta-bloqueada', id: '2,3,h', llave: 'roja' }
  ]);
  assert.equal(estado.muros['2,3,h'].abriendo, false);

  agregar(estado.inventario, 'llave:roja');
  assert.equal(consultarInteraccion(modelo, estado).texto, 'E · abrir puerta');
  assert.deepEqual(actualizar(modelo, estado, INTERACTUAR, 0.05), [{ tipo: 'puerta-abriendo', id: '2,3,h' }]);
});

// Celdas alcanzables desde el inicio, contando como abiertas solo las puertas indicadas.
function alcanzables(modelo, abiertas) {
  const porId = new Map(modelo.muros.map((m) => [m.id, m]));
  const bloquea = (id) => {
    const muro = porId.get(id);
    return Boolean(muro) && !(muro.tipo === 'puerta' && abiertas.has(id));
  };
  const inicio = [Math.floor(modelo.inicio.x / CELDA), Math.floor(modelo.inicio.z / CELDA)];
  const visto = new Set([inicio.join(',')]);
  const pila = [inicio];
  while (pila.length) {
    const [x, y] = pila.pop();
    const vecinos = [
      [x + 1, y, `${x + 1},${y},v`],
      [x - 1, y, `${x},${y},v`],
      [x, y + 1, `${x},${y + 1},h`],
      [x, y - 1, `${x},${y},h`]
    ];
    for (const [nx, ny, id] of vecinos) {
      if (nx < -1 || ny < -1 || nx > modelo.columnas - 1 || ny > modelo.filas - 1) continue;
      if (bloquea(id)) continue;
      const clave = `${nx},${ny}`;
      if (!visto.has(clave)) {
        visto.add(clave);
        pila.push([nx, ny]);
      }
    }
  }
  return visto;
}

function zona(x0, x1, y0, y1) {
  const celdas = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) celdas.push(`${x},${y}`);
  return celdas;
}

test('el nivel de ejemplo conecta sus cuatro zonas a través de las tres puertas', () => {
  const { modelo } = crearJuegoDe();
  const salaGrande = zona(1, 3, 3, 5);
  const pasilloL = ['0,0', '1,0', '2,0', '2,1', '2,2'];
  const pasilloS = ['4,4', '5,4', '6,4', '7,4', '7,3'];
  const salaPequena = zona(6, 7, 1, 2);
  const iguales = (visto, ...zonas) => {
    const esperado = new Set(zonas.flat());
    return visto.size === esperado.size && [...esperado].every((celda) => visto.has(celda));
  };

  assert.ok(iguales(alcanzables(modelo, new Set()), salaGrande), 'cerradas: solo la sala grande');
  assert.ok(iguales(alcanzables(modelo, new Set(['2,3,h'])), salaGrande, pasilloL));
  assert.ok(iguales(alcanzables(modelo, new Set(['4,4,v'])), salaGrande, pasilloS));
  assert.ok(iguales(alcanzables(modelo, new Set(['7,3,h'])), salaGrande), 'esa puerta sola no lleva a ninguna parte');
  assert.ok(iguales(alcanzables(modelo, new Set(['4,4,v', '7,3,h'])), salaGrande, pasilloS, salaPequena));
  assert.ok(
    iguales(alcanzables(modelo, new Set(['2,3,h', '4,4,v', '7,3,h'])), salaGrande, pasilloL, pasilloS, salaPequena),
    'abiertas: las cuatro zonas y nada del exterior'
  );
});

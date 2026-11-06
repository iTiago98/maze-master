// Reglas de arquitectura de CLAUDE.md y docs/CONTRATOS.md, comprobadas leyendo el código fuente:
// qué carpeta puede importar de cuál, quién puede usar three y el DOM, y sin estado global.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../../src/', import.meta.url));

function listarJs(carpeta) {
  return readdirSync(carpeta, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(carpeta, entrada.name);
    if (entrada.isDirectory()) return listarJs(ruta);
    return entrada.name.endsWith('.js') ? [ruta] : [];
  });
}

function importaciones(texto) {
  const encontradas = [...texto.matchAll(/\bfrom\s+'([^']+)'/g)].map((m) => m[1]);
  return encontradas.concat([...texto.matchAll(/^\s*import\s+'([^']+)'/gm)].map((m) => m[1]));
}

const archivos = listarJs(SRC).map((ruta) => ({
  ruta,
  relativa: relative(SRC, ruta),
  area: relative(SRC, ruta).split(sep)[0],
  texto: readFileSync(ruta, 'utf8')
}));

// Qué puede importar cada carpeta (el primer tramo de la ruta relativa a src/).
const PERMITIDO = {
  nivel: ['constantes.js', 'nivel'],
  logica: ['constantes.js', 'logica'],
  render: ['constantes.js', 'render'],
  entrada: ['constantes.js', 'acciones.js', 'entrada']
};

test('hay código fuente que comprobar', () => {
  assert.ok(archivos.length > 15);
});

test('cada carpeta solo importa lo que le corresponde', () => {
  for (const archivo of archivos) {
    const permitido = PERMITIDO[archivo.area];
    if (!permitido) continue; // aplicacion.js, main.js, constantes.js y acciones.js
    for (const importado of importaciones(archivo.texto)) {
      assert.ok(importado.startsWith('.'), `${archivo.relativa} importa "${importado}": sin dependencias externas`);
      const destino = relative(SRC, resolve(dirname(archivo.ruta), importado)).split(sep)[0];
      assert.ok(
        permitido.includes(destino),
        `${archivo.relativa} importa "${importado}", que no está permitido para ${archivo.area}/`
      );
    }
  }
});

test('solo main.js importa three', () => {
  for (const archivo of archivos.filter((a) => a.relativa !== 'main.js')) {
    assert.ok(!importaciones(archivo.texto).includes('three'), `${archivo.relativa} importa three`);
  }
  const main = archivos.find((a) => a.relativa === 'main.js');
  assert.ok(importaciones(main.texto).includes('three'));
});

test('la lógica y el formato no usan el DOM ni three', () => {
  const prohibidas = /\b(document|window|THREE|localStorage|requestAnimationFrame)\b/;
  for (const archivo of archivos.filter((a) => a.area === 'logica' || a.area === 'nivel')) {
    assert.doesNotMatch(archivo.texto, prohibidas, `${archivo.relativa} usa algo del navegador o de three`);
  }
});

test('no hay variables mutables a nivel de módulo (estado global)', () => {
  for (const archivo of archivos) {
    assert.doesNotMatch(archivo.texto, /^(let|var)\s/m, `${archivo.relativa} declara una variable mutable de módulo`);
  }
});

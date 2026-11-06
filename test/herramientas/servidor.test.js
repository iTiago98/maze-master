import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { crearServidor } from '../../herramientas/servidor.js';

test('el servidor estático sirve archivos y no sale de su carpeta', async (t) => {
  const padre = await mkdtemp(join(tmpdir(), 'maze-master-'));
  const raiz = join(padre, 'raiz');
  await mkdir(join(raiz, 'sub'), { recursive: true });
  await writeFile(join(raiz, 'index.html'), '<h1>hola</h1>');
  await writeFile(join(raiz, 'sub', 'a.js'), 'export {};');
  await writeFile(join(raiz, 'datos.json'), '{}');
  await writeFile(join(padre, 'secreto.txt'), 'no debe salir');

  const servidor = crearServidor(raiz);
  await new Promise((listo) => servidor.listen(0, '127.0.0.1', listo));
  t.after(async () => {
    servidor.closeAllConnections();
    await new Promise((cerrado) => servidor.close(cerrado));
    await rm(padre, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${servidor.address().port}`;

  const inicio = await fetch(`${base}/`);
  assert.equal(inicio.status, 200);
  assert.match(inicio.headers.get('content-type'), /text\/html/);
  assert.equal(await inicio.text(), '<h1>hola</h1>');

  const modulo = await fetch(`${base}/sub/a.js`);
  assert.equal(modulo.status, 200);
  assert.match(modulo.headers.get('content-type'), /text\/javascript/);

  assert.match((await fetch(`${base}/datos.json`)).headers.get('content-type'), /application\/json/);

  assert.equal((await fetch(`${base}/no-existe`)).status, 404);
  assert.equal((await fetch(`${base}/sub`)).status, 404, 'una carpeta no se lista');

  const escape = await fetch(`${base}/%2e%2e%2fsecreto.txt`);
  assert.equal(escape.status, 403);
  assert.doesNotMatch(await escape.text(), /no debe salir/);

  assert.equal((await fetch(`${base}/%E0%A4%A`)).status, 400);
});

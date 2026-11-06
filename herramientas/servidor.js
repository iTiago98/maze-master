// Servidor estático local para desarrollo (los módulos ES no funcionan desde file://).
// Uso: npm start  (puerto 8000, o el de la variable PORT). Solo escucha en 127.0.0.1.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const TIPOS_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

export function crearServidor(raiz) {
  const base = resolve(raiz);

  return createServer(async (peticion, respuesta) => {
    const responder = (codigo, texto) => {
      respuesta.writeHead(codigo, { 'Content-Type': 'text/plain; charset=utf-8' });
      respuesta.end(texto);
    };

    try {
      let ruta = decodeURIComponent(new URL(peticion.url, 'http://localhost').pathname);
      if (ruta.endsWith('/')) ruta += 'index.html';
      const archivo = resolve(join(base, ruta));

      if (archivo !== base && !archivo.startsWith(base + sep)) return responder(403, 'Prohibido');

      const info = await stat(archivo);
      if (!info.isFile()) return responder(404, 'No encontrado');

      const contenido = await readFile(archivo);
      respuesta.writeHead(200, {
        'Content-Type': TIPOS_MIME[extname(archivo).toLowerCase()] ?? 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      respuesta.end(contenido);
    } catch (error) {
      if (error instanceof URIError) return responder(400, 'Petición incorrecta');
      responder(404, 'No encontrado');
    }
  });
}

const esPrincipal = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (esPrincipal) {
  const puerto = Number(process.env.PORT) || 8000;
  const raiz = fileURLToPath(new URL('..', import.meta.url));
  crearServidor(raiz).listen(puerto, '127.0.0.1', () => {
    console.log(`Maze Master en http://localhost:${puerto}  (Ctrl+C para parar)`);
  });
}

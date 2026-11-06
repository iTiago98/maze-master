// Arranque en el navegador. Es el único archivo que importa three.

import * as THREE from 'three';
import { crearAplicacion } from './aplicacion.js';

const app = crearAplicacion({
  THREE,
  documento: document,
  ventana: window,
  solicitarFrame: (funcion) => requestAnimationFrame(funcion)
});

try {
  const respuesta = await fetch(new URL('../datos/nivel.json', import.meta.url));
  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
  app.cargarSeguro(await respuesta.json());
} catch (error) {
  app.hud.mostrarAviso(`No se pudo leer el nivel de ejemplo: ${error.message}`);
}

app.iniciar();

// Construye las mallas del nivel a partir del modelo y las sincroniza con el estado.

import { ALTO } from '../constantes.js';
import { tipoDeRender } from './tipos/index.js';

const MARGEN = 20; // el suelo y el techo sobresalen del plano

// Devuelve { grupo, techoVisible, actualizar(estado), alternarTecho(), liberar() }.
export function construirMapa(THREE, modelo, { techoVisible = true } = {}) {
  const grupo = new THREE.Group();
  const materiales = {
    pared: new THREE.MeshLambertMaterial({ color: 0xd8d4c8 }),
    puerta: new THREE.MeshLambertMaterial({ color: 0xb5651d }),
    suelo: new THREE.MeshLambertMaterial({ color: 0x232833 }),
    techo: new THREE.MeshLambertMaterial({ color: 0x161a22 })
  };

  // Las cajas del mismo tamaño comparten geometría.
  const geometrias = new Map();
  const ctx = {
    grupo,
    materiales,
    // Caja a lo largo de un muro: u0..u1 es el tramo sobre su eje y y0..y1 la altura.
    caja(muro, u0, u1, y0, y1, grosor, material) {
      const ancho = muro.horizontal ? u1 - u0 : grosor;
      const fondo = muro.horizontal ? grosor : u1 - u0;
      const alto = y1 - y0;
      const clave = [ancho, alto, fondo].map((n) => n.toFixed(4)).join('|');
      let geometria = geometrias.get(clave);
      if (!geometria) {
        geometria = new THREE.BoxGeometry(ancho, alto, fondo);
        geometrias.set(clave, geometria);
      }
      const malla = new THREE.Mesh(geometria, material);
      const u = (u0 + u1) / 2;
      malla.position.set(muro.a.x + muro.dir.x * u, (y0 + y1) / 2, muro.a.z + muro.dir.z * u);
      grupo.add(malla);
      return malla;
    }
  };

  const animados = [];
  for (const muro of modelo.muros) {
    const animador = tipoDeRender(muro.tipo).construir(THREE, ctx, muro);
    if (animador) animados.push({ id: muro.id, animador });
  }

  const ancho = modelo.limites.ancho + MARGEN * 2;
  const fondo = modelo.limites.fondo + MARGEN * 2;
  const centroX = modelo.limites.ancho / 2;
  const centroZ = modelo.limites.fondo / 2;

  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(ancho, fondo), materiales.suelo);
  suelo.rotation.x = -Math.PI / 2;
  suelo.position.set(centroX, 0, centroZ);
  grupo.add(suelo);

  const techo = new THREE.Mesh(new THREE.PlaneGeometry(ancho, fondo), materiales.techo);
  techo.rotation.x = Math.PI / 2;
  techo.position.set(centroX, ALTO, centroZ);
  techo.visible = techoVisible;
  grupo.add(techo);

  return {
    grupo,
    get techoVisible() {
      return techo.visible;
    },
    actualizar(estado) {
      for (const { id, animador } of animados) animador.actualizar(estado.muros[id]);
    },
    alternarTecho() {
      techo.visible = !techo.visible;
    },
    liberar() {
      for (const geometria of geometrias.values()) geometria.dispose();
      suelo.geometry.dispose();
      techo.geometry.dispose();
      for (const material of Object.values(materiales)) material.dispose?.();
    }
  };
}

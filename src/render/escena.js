// Escena, cámara, luces y renderizador. Recibe THREE inyectado (docs/CONTRATOS.md, sección 1).

import { ALTURA_OJOS } from '../constantes.js';

const FONDO = 0x0b0d12;

export function crearEscena(THREE, contenedor, ventana) {
  const escena = new THREE.Scene();
  escena.background = new THREE.Color(FONDO);
  escena.fog = new THREE.Fog(FONDO, 6, 40);

  const camara = new THREE.PerspectiveCamera(75, ventana.innerWidth / ventana.innerHeight, 0.05, 200);
  camara.rotation.order = 'YXZ';

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(ventana.devicePixelRatio, 2));
  renderer.setSize(ventana.innerWidth, ventana.innerHeight);
  contenedor.appendChild(renderer.domElement);

  escena.add(new THREE.HemisphereLight(0xffffff, 0x303040, 2.2));
  const sol = new THREE.DirectionalLight(0xffffff, 2.6);
  sol.position.set(3, 8, 5);
  escena.add(sol);

  return {
    escena,
    camara,
    renderer,
    redimensionar() {
      camara.aspect = ventana.innerWidth / ventana.innerHeight;
      camara.updateProjectionMatrix();
      renderer.setSize(ventana.innerWidth, ventana.innerHeight);
    },
    dibujar(jugador) {
      camara.position.set(jugador.x, ALTURA_OJOS, jugador.z);
      camara.rotation.y = jugador.yaw;
      renderer.render(escena, camara);
    }
  };
}

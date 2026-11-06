# Maze Master

Visor 3D minimalista, en el navegador, de laberintos descritos en un JSON de rejilla.

```
npm start        # servidor local en http://localhost:8000
npm test         # pruebas (Node 22 o superior, sin dependencias)
```

Los módulos ES no funcionan abriendo `index.html` con doble clic: hay que servirlo (`npm start`). `three` se carga desde un CDN, así que hace falta conexión a internet.

## Controles

| Tecla | Acción |
|---|---|
| W A S D | Moverse |
| ← → | Girar la cámara |
| E | Abrir una puerta (hay que mirarla y estar cerca) |
| C | Activar o desactivar las colisiones |
| T | Mostrar u ocultar el techo |

También puedes arrastrar un `.json` a la ventana para cargar otro nivel.

## Formato del nivel

Resumen; el formato completo está en [`docs/CONTRATOS.md`](docs/CONTRATOS.md).

```json
{
  "version": 2,
  "layout": [[3, 1, 1, 2], [0, 0, 0, 0]],
  "muros": { "1,0,h": { "tipo": "puerta" } },
  "inicio": { "x": 0.5, "y": 1.5, "angulo": 0 }
}
```

Cada elemento de `layout` es un vértice de la rejilla: `1` = muro hacia la derecha, `2` = muro hacia abajo, `3` = ambos, `0` = ninguno. `muros` anota muros concretos (`"x,y,h"` sale hacia la derecha y `"x,y,v"` hacia abajo) con un tipo, como `puerta`.

Para dibujar el plano en ASCII: `python3 herramientas/render_layout.py datos/nivel.json`.

## Estructura

```
index.html               página del visor (HUD y mapa de importación de three)
datos/nivel.json         nivel de ejemplo
herramientas/            servidor local, dibujo ASCII
src/
  main.js                arranque (único que importa three)
  aplicacion.js          une entrada, lógica y render
  constantes.js, acciones.js
  nivel/                 valida el JSON y lo convierte en un modelo
  logica/                movimiento, colisiones, interacción, inventario, tipos de muro (sin DOM ni three)
  entrada/               teclado → acciones
  render/                escena, mapa, HUD, dibujo de cada tipo de muro
test/                    pruebas, una carpeta por área
docs/                    contratos entre áreas y lista de tareas
```

Para trabajar en paralelo con varios chats, lee [`CLAUDE.md`](CLAUDE.md) (reglas y propiedad por carpeta), [`docs/CONTRATOS.md`](docs/CONTRATOS.md) y [`docs/TAREAS.md`](docs/TAREAS.md).

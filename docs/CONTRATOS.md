# Contratos

Este documento es la **fuente de verdad** de lo que comparten las áreas (formato y herramientas, lógica, render y HUD, entrada). Mientras cada área respete estos contratos, puede trabajar en su carpeta sin hablar con las demás.

`test/contratos/` comprueba automáticamente las formas descritas aquí. Si un cambio rompe esos tests, o has cambiado un contrato, o has roto uno sin querer.

## 1. Convenciones

- **Plano visto desde arriba:** `x` crece hacia la derecha y `z` hacia abajo (la fila `y` del `layout` es la coordenada `z`). La altura es `y` y sube.
- **Unidades de mundo:** una celda de la rejilla mide `CELDA` = 4 unidades (ver `src/constantes.js`). El modelo y el estado usan siempre unidades de mundo. El JSON usa **celdas** (por ejemplo, `inicio.x = 2.5` es el centro de la celda 2).
- **Ángulos:** radianes en el modelo y en el estado, grados en el JSON.
- **Orientación (`yaw`):** `yaw = 0` mira hacia `-z` (hacia arriba en el plano). `yaw` crece al girar hacia la izquierda. La dirección de la mirada es `(-sin yaw, -cos yaw)` y la derecha del jugador es `(cos yaw, -sin yaw)`.
- **Tiempo:** `dt` en segundos.
- **Identificador de muro:** `"x,y,h"` es el muro que sale del vértice de columna `x` y fila `y` hacia la derecha; `"x,y,v"` es el que sale hacia abajo. Coincide con los bits 1 y 2 del `layout`.
- **Idioma:** nombres y comentarios en español.
- **Dependencias:** solo `src/main.js` importa `three`. El resto recibe `THREE` inyectado, así que se puede probar en Node sin instalar nada.

## 2. Formato JSON del nivel (versión 2)

```json
{
  "version": 2,
  "layout": [[3, 1, 1, 2], [0, 0, 0, 0]],
  "muros": { "1,0,h": { "tipo": "puerta", "llave": "roja" } },
  "inicio": { "x": 0.5, "y": 1.5, "angulo": 0 },
  "cosas": [{ "tipo": "llave", "color": "roja", "x": 2.5, "y": 0.5 }]
}
```

| Clave | Obligatoria | Significado |
|---|---|---|
| `layout` | sí | Matriz de vértices. Bit 1 = muro hacia la derecha, bit 2 = muro hacia abajo (0 nada, 1 horizontal, 2 vertical, 3 ambos). Todas las filas con la misma longitud. |
| `version` | no (por defecto 1) | Versión del formato. Si es mayor que `VERSION_FORMATO`, el visor avisa y sigue ignorando lo que no conoce. |
| `muros` | no | Anotaciones sobre muros concretos, por identificador. Cada valor es un objeto con `tipo` (por defecto `"pared"`) y las propiedades propias de ese tipo. Anotar un muro que no existe en el `layout` es un error. |
| `inicio` | no | Posición inicial en celdas (`x`, `y`) y `angulo` en grados. Si falta, se usa la celda libre más cercana al centro. |
| `cosas` | no | Objetos del nivel (llaves, enemigos...). `x` e `y` en celdas. Se cargan en el modelo pero **todavía nada los usa** (ver `docs/TAREAS.md`). |

**Reglas de compatibilidad**

1. Todo lo nuevo es opcional y tiene un valor por defecto, para que los JSON antiguos sigan funcionando.
2. El cargador ignora las claves que no conoce.
3. Los tipos son texto abierto con parámetros propios; no se codifican con más bits en el `layout`.
4. Un muro que sale de la matriz se ignora con un aviso.

## 3. Modelo de nivel

`cargarNivel(datos, opciones?)` en `src/nivel/formato.js` valida el JSON y devuelve el modelo. Lanza un `Error` con un mensaje legible si el JSON no es válido, sin efectos secundarios. `opciones.tiposConocidos` (lista de nombres) permite avisar de tipos de muro desconocidos.

```js
{
  version: 2,
  columnas: 9, filas: 9,                 // tamaño de la matriz de vértices
  limites: { ancho: 32, fondo: 32 },     // extensión del plano en unidades de mundo (x, z)
  muros: [                               // TODOS los muros, en orden de fila y columna, h antes que v
    {
      id: '2,3,h',
      tipo: 'pared',                     // o 'puerta', etc.
      horizontal: true,
      a: { x: 8, z: 12 }, b: { x: 12, z: 12 },   // extremos en unidades de mundo
      dir: { x: 1, z: 0 },               // vector unitario de a hacia b
      props: {}                          // propiedades de la anotación, sin "tipo"
    }
  ],
  cosas: [{ id: 'cosa-0', tipo: 'llave', x: 10, z: 2, props: { color: 'roja' } }],
  inicio: { x: 10, z: 18, yaw: 0 },
  avisos: []                             // textos para mostrar al jugador al cargar
}
```

El modelo **no cambia** mientras se juega. Todo lo que cambia vive en el estado.

## 4. Estado del juego

`crearEstado(modelo)` en `src/logica/index.js`. Lo modifica solo la lógica; el render lo lee.

```js
{
  jugador: { x, z, yaw },                // unidades de mundo y radianes
  muros: { '2,3,h': { abierta: 0, abriendo: false } },   // estado por muro; solo los tipos con estado
  inventario: ['llave:roja'],            // lista de textos "<categoría>:<nombre>"
  opciones: { colisiones: true }
}
```

El contenido de `estado.muros[id]` lo define cada tipo de muro (`estadoInicial`). Para `puerta`, `abierta` va de 0 (cerrada) a 1 (abierta) y `abriendo` indica que ya se activó.

## 5. Acciones (entrada → lógica)

`crearTeclado(ventana).leer()` devuelve en cada fotograma:

```js
{
  avanzar: 0,              // 1 adelante, -1 atrás
  lateral: 0,              // 1 derecha, -1 izquierda
  girar: 0,                // 1 hacia la izquierda, -1 hacia la derecha
  interactuar: false,      // true solo en el fotograma en que se pulsa
  alternarColisiones: false,   // ídem
  alternarTecho: false         // ídem (lo gestiona la aplicación, no la lógica)
}
```

`accionesVacias()` (en `src/acciones.js`) devuelve ese objeto con todo a cero. Cualquier otra entrada (mando, táctil) produce el mismo objeto.

## 6. Eventos (lógica → render y HUD)

`actualizar(modelo, estado, acciones, dt)` devuelve una lista de eventos ocurridos en ese fotograma:

| `tipo` | Campos | Cuándo |
|---|---|---|
| `puerta-abriendo` | `id` | El jugador activa una puerta. |
| `puerta-bloqueada` | `id`, `llave` | El jugador intenta abrir una puerta que necesita una llave que no tiene. |

`textoDeEvento(evento)` en `src/render/hud.js` los convierte en texto para el jugador.

## 7. API pública por área

| Módulo | Exporta |
|---|---|
| `src/nivel/formato.js` | `cargarNivel(datos, opciones?) → modelo` |
| `src/logica/index.js` | `crearEstado(modelo) → estado`<br>`actualizar(modelo, estado, acciones, dt) → eventos`<br>`consultarInteraccion(modelo, estado) → { id, texto } \| null`<br>`nombresDeTipos() → string[]` |
| `src/logica/inventario.js` | `crearInventario()`, `tiene(inv, objeto)`, `agregar(inv, objeto)`, `quitar(inv, objeto)` |
| `src/entrada/teclado.js` | `crearTeclado(objetivo) → { leer(), destruir() }` |
| `src/render/escena.js` | `crearEscena(THREE, contenedor, ventana) → { escena, camara, renderer, redimensionar(), dibujar(jugador) }` |
| `src/render/mapa.js` | `construirMapa(THREE, modelo, { techoVisible? }) → { grupo, techoVisible, actualizar(estado), alternarTecho(), liberar() }` |
| `src/render/hud.js` | `crearHud(doc, ventana?) → { mostrarAviso(texto), mostrarPista(texto \| null), establecerColisiones(bool) }`, `textoDeEvento(evento)` |
| `src/aplicacion.js` | `crearAplicacion({ THREE, documento, ventana, solicitarFrame }) → { cargar, cargarSeguro, paso, iniciar, hud, vista, modelo, estado }` |

**Dependencias permitidas entre carpetas** (las comprueba `test/contratos/reglas.test.js`):

- `nivel/` solo importa `constantes.js`.
- `logica/` solo importa `constantes.js` y su propia carpeta. Sin DOM ni `three`.
- `render/` solo importa `constantes.js` y su propia carpeta. Recibe `THREE` inyectado.
- `entrada/` solo importa `constantes.js` y `acciones.js`.
- `aplicacion.js` y `main.js` pueden importar de todas.

## 8. Tipos de muro

Cada tipo de muro (`pared`, `puerta`, y los que vengan: `secreto`, `interruptor`...) son **dos piezas**, una de lógica y otra de render, que se registran por nombre. Añadir un tipo no toca movimiento, colisiones ni el mapa.

**Lógica** (`src/logica/tipos/<nombre>.js`, registrado en `src/logica/tipos/index.js`). Todos los métodos son opcionales y tienen un valor por defecto; `muro` es el del modelo, `est` su estado en `estado.muros[muro.id]` y `estado` el estado global.

| Método | Por defecto | Para qué |
|---|---|---|
| `nombre` | (obligatorio) | Nombre del tipo, el que se escribe en el JSON. |
| `estadoInicial(muro)` | `null` (sin estado) | Estado propio del muro. |
| `segmentosBloqueantes(muro, est)` | el muro entero | Lista de `[ax, az, bx, bz]` que bloquean al jugador ahora mismo. |
| `zonaInteractiva(muro, est, estado)` | `null` | Segmento `[ax, az, bx, bz]` con el que se puede interactuar ahora, o `null`. |
| `texto(muro, est, estado)` | `''` | Pista a mostrar cuando se apunta a la zona. |
| `interactuar(muro, est, estado)` | `[]` | Reacción a la interacción; devuelve eventos. |
| `actualizar(muro, est, dt, estado)` | nada | Avance por fotograma (animaciones, temporizadores). |

**Render** (`src/render/tipos/<nombre>.js`, registrado en `src/render/tipos/index.js`):

- `nombre`
- `construir(THREE, ctx, muro)`: crea las mallas del muro con `ctx.caja(muro, u0, u1, y0, y1, grosor, material)` y `ctx.materiales`. Si el muro se anima, devuelve `{ actualizar(est) }`; si es estático, devuelve `null`.

Un tipo desconocido se trata como `pared` (con un aviso al cargar).

**Para añadir un tipo:** crea su archivo en `logica/tipos/` y otro en `render/tipos/`, y añade una línea en cada `index.js`. El test `test/contratos/` falla si un tipo existe en un lado y no en el otro.

## 9. Cómo se cambia un contrato

1. Abre un issue o un PR con el prefijo `[contrato]` que explique el cambio y quién se ve afectado.
2. Actualiza **en el mismo PR** este documento, el código y `test/contratos/`.
3. Lo revisa y mergea el integrador. Los demás reciben el cambio con `git pull --rebase origin main` antes de seguir.
4. Los cambios compatibles (un campo opcional nuevo) se prefieren a los que rompen algo.

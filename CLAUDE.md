# Maze Master

Visor 3D minimalista, en el navegador, de laberintos descritos en un JSON de rejilla (paredes, puertas, y más adelante pasadizos secretos, llaves e interruptores). Está pensado para que varios chats de Claude trabajen en paralelo, cada uno en su área, sobre este mismo repositorio.

## Antes de empezar

1. `git pull --rebase origin main`.
2. Lee `docs/CONTRATOS.md` (lo que comparten las áreas) y `docs/TAREAS.md` (qué hay por hacer).
3. Comprueba que tu tarea no esté ya tomada: una tarea está tomada si existe su rama (`git ls-remote --heads origin`).
4. `npm test` debe pasar antes de que toques nada.

## Propiedad por carpeta

Cada chat edita **solo las carpetas de su área**. Si necesitas un cambio en otra, no lo hagas tú: abre un issue con el nombre del área dueña y descríbelo.

| Área | Carpetas y archivos | Tests |
|---|---|---|
| Formato y herramientas | `src/nivel/`, `herramientas/`, `datos/` | `test/nivel/`, `test/herramientas/` |
| Lógica | `src/logica/` | `test/logica/` |
| Render y HUD | `src/render/`, `index.html` | `test/render/` |
| Entrada | `src/entrada/` | `test/entrada/` |
| Integración (integrador) | `src/main.js`, `src/aplicacion.js`, `src/constantes.js`, `src/acciones.js`, `package.json`, `.github/`, `docs/`, `CLAUDE.md` | `test/contratos/`, `test/integracion/`, `test/ayudas/` |

Los archivos de integración los toca solo el integrador. Un tipo de muro nuevo es la excepción controlada: su archivo en `logica/tipos/` y otro en `render/tipos/` lo crea cada área en su carpeta, y el registro de una línea en el `index.js` de cada una lo añade su dueña.

## Reglas de código

- **Lógica pura:** `src/logica/` y `src/nivel/` no usan DOM ni `three`. Reciben datos y devuelven datos.
- **`three` inyectado:** solo `src/main.js` importa `three`. El resto de `render/` recibe `THREE` como parámetro, para poder probarlo en Node con un falso (`test/ayudas/falsos.js`).
- **Sin estado global:** nada de variables de módulo que cambien. El estado es el objeto de `crearEstado` y se pasa explícitamente.
- **Respeta los contratos** de `docs/CONTRATOS.md`. Si tu tarea los cambia, es un PR `[contrato]` aparte.
- **Nombres y comentarios en español.**
- **Todo lo nuevo lleva pruebas** en la carpeta `test/` de tu área (`node:test`, sin dependencias).
- **Compatibilidad del JSON:** lo nuevo es opcional y con valor por defecto; los niveles antiguos siguen cargando.

## Flujo de trabajo

- **Una tarea, un chat, una rama.** Ramas: `<área>/<tarea>` (por ejemplo `logica/secretos`), con el nombre sugerido en `docs/TAREAS.md`.
- **Nunca commit directo a `main`.** Todo entra por PR.
- **PR pequeños:** título `[área] Qué hace`; descripción con *Qué*, *Por qué* y *Cómo probarlo* (hay una plantilla). Los cambios de contrato llevan el prefijo `[contrato]`.
- **Commits:** en español, en imperativo, primera línea de 72 caracteres como máximo.
- **CI en verde** (`npm test` y la comprobación de `herramientas/render_layout.py`) antes de pedir el merge. Mergea el integrador.
- Antes de abrir el PR, `git pull --rebase origin main` y vuelve a pasar los tests.
- No arregles de paso cosas de otras áreas, aunque veas el fallo: abre un issue.

## Comandos

- `npm test`: todas las pruebas.
- `npm start`: servidor local en <http://localhost:8000> (los módulos ES no funcionan abriendo `index.html` con doble clic).
- `python3 herramientas/render_layout.py datos/nivel.json`: dibuja el plano en ASCII.

# Tareas

Lista de trabajo por área. **Solo la edita el integrador.** Para tomar una tarea, crea su rama (el nombre sugerido está entre paréntesis): si la rama existe, la tarea está tomada.

Una tarea es de un chat y de una rama. Si una tarea toca varias áreas, se divide en una por área y la primera en mergearse es la de contrato, si la hay.

## Formato y herramientas

- [ ] `formato/exportador-wad`: exportar el nivel a un PWAD de Doom (VERTEXES, LINEDEFS, SIDEDEFS, SECTORS, THINGS) para pasarlo por un nodebuilder.
- [ ] `formato/habitaciones`: detectar las regiones cerradas (flood fill) y añadirlas al modelo, para sectores y para suelo y techo por sala.
- [ ] `formato/ascii-puertas`: que `render_layout.py` marque en el ASCII los muros anotados (puertas, secretos).
- [ ] `formato/segmentos`: segundo formato de entrada, una lista de segmentos `[x1, y1, x2, y2]`, que se convierte al mismo modelo.
- [ ] `formato/cosas-validacion`: validar los tipos de `cosas` conocidos (llave, interruptor...) y avisar de los desconocidos.

## Lógica

- [ ] `logica/secretos`: tipo de muro `secreto` (parece pared; se abre al interactuar, como una puerta que se desliza).
- [ ] `logica/llaves`: recoger las `cosas` de tipo `llave` al acercarse, y meterlas en el inventario como `llave:<color>` (las puertas con `llave` ya lo consultan).
- [ ] `logica/interruptores`: tipo `interruptor` que abre una puerta por `id`/`objetivo`.
- [ ] `logica/cerrar-puertas`: puertas que se cierran solas tras un tiempo si el jugador no está en el hueco.
- [ ] `logica/inventario-objetos`: más objetos además de llaves (cantidades, usar, soltar).

## Render y HUD

- [ ] `render/inventario-hud`: mostrar el inventario en pantalla.
- [ ] `render/cosas`: dibujar las `cosas` del modelo (por ejemplo, la llave como una pieza que gira).
- [ ] `render/color-llave`: las puertas con `llave` se dibujan del color de su llave.
- [ ] `render/geometria-fusionada`: fusionar las paredes estáticas en una sola malla para mapas grandes.
- [ ] `render/minimapa`: minimapa 2D en el HUD.
- [ ] `render/animacion-secreto`: animación del tipo `secreto` (depende de `logica/secretos`).

## Entrada

- [ ] `entrada/mando`: soporte de mando (Gamepad API), produciendo las mismas acciones.
- [ ] `entrada/remapeo`: teclas configurables.
- [ ] `entrada/raton`: giro con el ratón (opcional, activable).

## Integración

- [ ] `base/versiones`: política de migración cuando suba `VERSION_FORMATO`.
- [ ] `base/pantalla-carga`: selector de niveles de `datos/`.

// HUD: avisos, pista de interacción y estado de las colisiones.
// Usa los elementos de index.html con id "aviso", "pista" y "col".

// Convierte un evento de la lógica (docs/CONTRATOS.md, sección 6) en un texto para el jugador, o null.
export function textoDeEvento(evento) {
  switch (evento.tipo) {
    case 'puerta-bloqueada':
      return `La puerta está cerrada con llave: necesitas la llave ${evento.llave}`;
    default:
      return null;
  }
}

export function crearHud(doc, ventana = globalThis) {
  const elAviso = doc.getElementById('aviso');
  const elPista = doc.getElementById('pista');
  const elColisiones = doc.getElementById('col');
  let temporizador = null;
  let textoPista = null;

  return {
    mostrarAviso(texto, milisegundos = 5000) {
      elAviso.textContent = texto;
      elAviso.style.display = 'block';
      ventana.clearTimeout(temporizador);
      temporizador = ventana.setTimeout(() => {
        elAviso.style.display = 'none';
      }, milisegundos);
    },
    // Con null oculta la pista. Solo toca el DOM cuando el texto cambia.
    mostrarPista(texto) {
      const nuevo = texto || null;
      if (nuevo === textoPista) return;
      textoPista = nuevo;
      if (nuevo) {
        elPista.textContent = nuevo;
        elPista.style.display = 'block';
      } else {
        elPista.style.display = 'none';
      }
    },
    establecerColisiones(activas) {
      elColisiones.textContent = activas ? 'sí' : 'no';
    }
  };
}

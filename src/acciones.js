// Contrato entre la entrada y la lógica: ver docs/CONTRATOS.md, sección 5.

export function accionesVacias() {
  return {
    avanzar: 0,               // 1 adelante, -1 atrás
    lateral: 0,               // 1 derecha, -1 izquierda
    girar: 0,                 // 1 hacia la izquierda, -1 hacia la derecha
    interactuar: false,       // true solo en el fotograma en que se pulsa
    alternarColisiones: false,
    alternarTecho: false
  };
}

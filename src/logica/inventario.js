// El inventario es una lista de textos "<categoría>:<nombre>", por ejemplo "llave:roja".

export function crearInventario() {
  return [];
}

export function tiene(inventario, objeto) {
  return inventario.includes(objeto);
}

export function agregar(inventario, objeto) {
  if (!tiene(inventario, objeto)) inventario.push(objeto);
}

export function quitar(inventario, objeto) {
  const posicion = inventario.indexOf(objeto);
  if (posicion >= 0) inventario.splice(posicion, 1);
}

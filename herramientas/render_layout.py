#!/usr/bin/env python3
"""Renderiza en ASCII un layout de paredes definido en JSON.

Cada celda de "layout" es un vértice de la rejilla en (x=columna, y=fila):
  bit 1 (valor 1): pared horizontal hacia el vértice de la derecha
  bit 2 (valor 2): pared vertical hacia el vértice de abajo
  3 = ambas, 0 = ninguna

Uso:
  python render_layout.py nivel.json
  python render_layout.py nivel.json --segmentos   # lista también los segmentos
  python render_layout.py nivel.json --ancho 6     # separación horizontal mayor
"""
import argparse
import json
import sys

HORIZ = 1
VERT = 2


def cargar_layout(ruta):
    with open(ruta, encoding="utf-8") as f:
        datos = json.load(f)
    layout = datos["layout"]
    if not layout or not layout[0]:
        raise ValueError("El layout está vacío")
    ancho = len(layout[0])
    for i, fila in enumerate(layout):
        if len(fila) != ancho:
            raise ValueError(f"La fila {i} tiene {len(fila)} columnas, se esperaban {ancho}")
        for j, v in enumerate(fila):
            if v not in (0, 1, 2, 3):
                raise ValueError(f"Valor inválido {v!r} en fila {i}, columna {j}")
    return layout


def extraer_segmentos(layout):
    """Devuelve (segmentos, avisos). Cada segmento es ((x1, y1), (x2, y2))."""
    filas, cols = len(layout), len(layout[0])
    segmentos, avisos = [], []
    for y in range(filas):
        for x in range(cols):
            v = layout[y][x]
            if v & HORIZ:
                if x + 1 < cols:
                    segmentos.append(((x, y), (x + 1, y)))
                else:
                    avisos.append(f"Pared horizontal fuera de la matriz en fila {y}, columna {x}")
            if v & VERT:
                if y + 1 < filas:
                    segmentos.append(((x, y), (x, y + 1)))
                else:
                    avisos.append(f"Pared vertical fuera de la matriz en fila {y}, columna {x}")
    return segmentos, avisos


def renderizar(layout, segmentos, paso=4):
    """Dibuja los vértices como '+' y las paredes como '-' y '|'."""
    filas, cols = len(layout), len(layout[0])
    alto = 2 * filas - 1
    ancho = paso * (cols - 1) + 1
    lienzo = [[" "] * ancho for _ in range(alto)]

    for y in range(filas):
        for x in range(cols):
            lienzo[2 * y][paso * x] = "+"

    for (x1, y1), (x2, y2) in segmentos:
        if y1 == y2:  # horizontal
            for k in range(1, paso):
                lienzo[2 * y1][paso * x1 + k] = "-"
        else:  # vertical
            lienzo[2 * y1 + 1][paso * x1] = "|"

    return "\n".join("".join(f).rstrip() for f in lienzo)


def main():
    parser = argparse.ArgumentParser(description="Renderiza un layout de paredes en ASCII")
    parser.add_argument("archivo", help="Ruta del JSON con la clave 'layout'")
    parser.add_argument("--segmentos", action="store_true", help="Imprime la lista de segmentos")
    parser.add_argument("--ancho", type=int, default=4,
                        help="Caracteres por celda en horizontal (mínimo 2, por defecto 4)")
    args = parser.parse_args()

    try:
        layout = cargar_layout(args.archivo)
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as e:
        sys.exit(f"Error: {e}")

    segmentos, avisos = extraer_segmentos(layout)
    print(renderizar(layout, segmentos, max(2, args.ancho)))

    for aviso in avisos:
        print(f"Aviso: {aviso}", file=sys.stderr)

    if args.segmentos:
        print(f"\n{len(segmentos)} segmentos:")
        for (x1, y1), (x2, y2) in segmentos:
            print(f"  ({x1},{y1}) -> ({x2},{y2})")


if __name__ == "__main__":
    main()

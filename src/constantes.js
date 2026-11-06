// Constantes compartidas por todas las áreas. Cambiar una afecta a todas: ver docs/CONTRATOS.md.

export const VERSION_FORMATO = 2; // versión del formato JSON que entiende este visor

// Mundo (unidades de mundo)
export const CELDA = 4;   // lado de una celda de la rejilla
export const ALTO = 3;    // altura de los muros
export const GROSOR = 0.15; // grosor de los muros

// Jugador
export const RADIO_JUGADOR = 0.4;
export const ALTURA_OJOS = 1.6;
export const VELOCIDAD = 4;        // unidades por segundo
export const VELOCIDAD_GIRO = 2;   // radianes por segundo
export const ALCANCE_INTERACCION = 2.2;

// Puertas
export const PUERTA_ANCHO = 2;
export const PUERTA_ALTO = 2.4;
export const PUERTA_POSTE = (CELDA - PUERTA_ANCHO) / 2; // tramo de muro a cada lado del hueco
export const PUERTA_DURACION = 0.8;       // segundos que tarda en abrirse
export const PUERTA_UMBRAL_ABIERTA = 0.75; // a partir de aquí se puede pasar

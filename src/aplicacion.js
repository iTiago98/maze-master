// Une entrada, lógica y render. Es el único sitio que conoce a las tres áreas.
// Todo se recibe inyectado (THREE, documento, ventana...) para poder probarlo en Node.

import { crearTeclado } from './entrada/teclado.js';
import { actualizar, consultarInteraccion, crearEstado, nombresDeTipos } from './logica/index.js';
import { cargarNivel } from './nivel/formato.js';
import { crearEscena } from './render/escena.js';
import { crearHud, textoDeEvento } from './render/hud.js';
import { construirMapa } from './render/mapa.js';

const DT_MAXIMO = 0.05; // un salto largo de tiempo (pestaña en segundo plano) no teletransporta al jugador

export function crearAplicacion({ THREE, documento, ventana, solicitarFrame }) {
  const hud = crearHud(documento, ventana);
  const vista = crearEscena(THREE, documento.body, ventana);
  const teclado = crearTeclado(ventana);

  let modelo = null;
  let estado = null;
  let mapa = null;
  let ultimoTiempo = null;

  // Si el JSON no es válido lanza un error antes de tocar nada: el nivel anterior sigue en pie.
  function cargar(datos) {
    const nuevoModelo = cargarNivel(datos, { tiposConocidos: nombresDeTipos() });
    const nuevoEstado = crearEstado(nuevoModelo);
    if (estado) nuevoEstado.opciones.colisiones = estado.opciones.colisiones;
    const nuevoMapa = construirMapa(THREE, nuevoModelo, { techoVisible: mapa ? mapa.techoVisible : true });

    if (mapa) {
      vista.escena.remove(mapa.grupo);
      mapa.liberar();
    }
    modelo = nuevoModelo;
    estado = nuevoEstado;
    mapa = nuevoMapa;
    vista.escena.add(mapa.grupo);
    mapa.actualizar(estado);
    hud.establecerColisiones(estado.opciones.colisiones);
    if (modelo.avisos.length > 0) hud.mostrarAviso(modelo.avisos.join(' · '));
  }

  function cargarSeguro(datos) {
    try {
      cargar(datos);
    } catch (error) {
      hud.mostrarAviso(`No se pudo cargar el nivel: ${error.message}`);
    }
  }

  function paso(tiempo) {
    const dt = ultimoTiempo === null ? 0 : Math.min((tiempo - ultimoTiempo) / 1000, DT_MAXIMO);
    ultimoTiempo = tiempo;
    if (!modelo) return;

    const acciones = teclado.leer();
    if (acciones.alternarTecho) mapa.alternarTecho();

    for (const evento of actualizar(modelo, estado, acciones, dt)) {
      const texto = textoDeEvento(evento);
      if (texto) hud.mostrarAviso(texto);
    }

    mapa.actualizar(estado);
    hud.establecerColisiones(estado.opciones.colisiones);
    const objetivo = consultarInteraccion(modelo, estado);
    hud.mostrarPista(objetivo ? objetivo.texto : null);
    vista.dibujar(estado.jugador);
  }

  function iniciar() {
    const bucle = (tiempo) => {
      paso(tiempo);
      solicitarFrame(bucle);
    };
    solicitarFrame(bucle);
  }

  ventana.addEventListener('resize', () => vista.redimensionar());
  ventana.addEventListener('dragover', (evento) => evento.preventDefault());
  ventana.addEventListener('drop', async (evento) => {
    evento.preventDefault();
    const archivo = evento.dataTransfer?.files?.[0];
    if (!archivo) return;
    try {
      cargar(JSON.parse(await archivo.text()));
    } catch (error) {
      hud.mostrarAviso(`No se pudo cargar el nivel: ${error.message}`);
    }
  });

  return {
    cargar,
    cargarSeguro,
    paso,
    iniciar,
    hud,
    vista,
    get modelo() {
      return modelo;
    },
    get estado() {
      return estado;
    }
  };
}

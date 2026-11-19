/**
 * fetch con tiempo máximo de espera.
 *
 * En redes móviles una petición puede quedarse colgada sin responder ni
 * fallar, y la interfaz se queda cargando para siempre. Con este límite la
 * petición se aborta y la aplicación puede mostrar un error.
 */
const TIEMPO_MAXIMO_MS = 15000;

export async function fetchConTiempo(url, opciones = {}, ms = TIEMPO_MAXIMO_MS) {
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), ms);
  try {
    return await fetch(url, { ...opciones, signal: control.signal });
  } finally {
    clearTimeout(temporizador);
  }
}

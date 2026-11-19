import { cabeceraAuth, avisarSiExpirada } from "./sesion";
import { fetchConTiempo } from "./http";
// Cliente HTTP para ms-contacto (http://localhost:8084 por defecto).
// Usa VITE_CONTACTO_API_URL.

const BASE = (import.meta.env.VITE_CONTACTO_API_URL || "").trim().replace(/\/$/, "");
export const contactoApiHabilitada = Boolean(BASE);

async function solicitar(ruta, opciones = {}) {
  if (!BASE) throw new Error("ms-contacto no está configurado (VITE_CONTACTO_API_URL).");
  let resp;
  try {
    resp = await fetchConTiempo(`${BASE}${ruta}`, {
      ...opciones,
      headers: {
        ...(opciones.body ? { "Content-Type": "application/json" } : {}),
        ...cabeceraAuth(),
        ...opciones.headers,
      },
    });
  } catch {
    throw new Error("No se pudo conectar con ms-contacto.");
  }
  if (!resp.ok) {
    avisarSiExpirada(resp.status);
    let detalle = `Error HTTP ${resp.status}`;
    try {
      const cuerpo = await resp.json();
      detalle = cuerpo.mensaje || detalle;
      const err = new Error(detalle);
      err.status = resp.status;
      err.errores = cuerpo.errores;
      throw err;
    } catch (e) {
      if (e.message && detalle === e.message) throw e;
      const err = new Error(detalle);
      err.status = resp.status;
      throw err;
    }
  }
  if (resp.status === 204) return null;
  return resp.json();
}

export function enviarMensajeApi(datos) {
  return solicitar("/api/v1/contacto", { method: "POST", body: JSON.stringify(datos) });
}
export function listarMensajesApi() { return solicitar("/api/v1/contacto"); }
export function marcarLeidoApi(id, valor = true) {
  return solicitar(`/api/v1/contacto/${id}/leido?valor=${valor}`, { method: "PATCH" });
}
export function eliminarMensajeApi(id) { return solicitar(`/api/v1/contacto/${id}`, { method: "DELETE" }); }
export function verificarSalud() { return solicitar("/api/health"); }

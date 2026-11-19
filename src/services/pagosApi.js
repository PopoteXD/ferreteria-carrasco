import { cabeceraAuth, avisarSiExpirada } from "./sesion";
import { fetchConTiempo } from "./http";
// Cliente HTTP para ms-pagos (http://localhost:8085 por defecto).
// Usa VITE_PAGOS_API_URL.

const BASE = (import.meta.env.VITE_PAGOS_API_URL || "").trim().replace(/\/$/, "");
export const pagosApiHabilitada = Boolean(BASE);

async function solicitar(ruta, opciones = {}) {
  if (!BASE) throw new Error("ms-pagos no está configurado (VITE_PAGOS_API_URL).");
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
    throw new Error("No se pudo conectar con ms-pagos.");
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

export function crearPagoApi(datos) {
  return solicitar("/api/v1/pagos", { method: "POST", body: JSON.stringify(datos) });
}
export function listarPagosApi(pedidoId) {
  const q = pedidoId ? `?pedidoId=${encodeURIComponent(pedidoId)}` : "";
  return solicitar(`/api/v1/pagos${q}`);
}
export function obtenerPagoApi(id) { return solicitar(`/api/v1/pagos/${id}`); }
export function confirmarPagoApi(id) { return solicitar(`/api/v1/pagos/${id}/confirmar`, { method: "PATCH" }); }
export function verificarSalud() { return solicitar("/api/health"); }

import { cabeceraAuth, avisarSiExpirada } from "./sesion";
import { fetchConTiempo } from "./http";
// Cliente HTTP para ms-pedidos (http://localhost:8083 por defecto).
// Usa VITE_PEDIDOS_API_URL. Si no está configurada, habilitado=false.

const BASE = (import.meta.env.VITE_PEDIDOS_API_URL || "").trim().replace(/\/$/, "");
export const pedidosApiHabilitada = Boolean(BASE);

async function solicitar(ruta, opciones = {}) {
  if (!BASE) throw new Error("ms-pedidos no está configurado (VITE_PEDIDOS_API_URL).");
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
    throw new Error("No se pudo conectar con ms-pedidos.");
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

export function crearPedidoApi(datos) {
  return solicitar("/api/pedidos", { method: "POST", body: JSON.stringify(datos) });
}
export function listarPedidosApi() { return solicitar("/api/pedidos"); }
export function listarPedidosPorCorreoApi(correo) {
  return solicitar(`/api/pedidos?correo=${encodeURIComponent(correo)}`);
}
export function obtenerPedidoApi(id) { return solicitar(`/api/pedidos/${encodeURIComponent(id)}`); }
export function cambiarEstadoPedidoApi(id, estado) {
  return solicitar(`/api/pedidos/${encodeURIComponent(id)}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });
}
export function resumenPedidosApi() { return solicitar("/api/pedidos/resumen"); }
export function verificarSalud() { return solicitar("/api/health"); }

import { productosApiHabilitada, solicitar } from "./productosApi";

// Las ofertas viven en ms-productos, por eso comparten su variable VITE_API_BASE_URL.
export const ofertasApiHabilitada = productosApiHabilitada;

export function listarOfertasApi() {
  return solicitar("/api/ofertas");
}

export function crearOfertaApi(oferta) {
  return solicitar("/api/ofertas", { method: "POST", body: JSON.stringify(oferta) });
}

export function actualizarOfertaApi(id, oferta) {
  return solicitar(`/api/ofertas/${id}`, { method: "PUT", body: JSON.stringify(oferta) });
}

export function cambiarActivaOfertaApi(id, activa) {
  return solicitar(`/api/ofertas/${id}/activa?valor=${activa}`, { method: "PATCH" });
}

export function eliminarOfertaApi(id) {
  return solicitar(`/api/ofertas/${id}`, { method: "DELETE" });
}

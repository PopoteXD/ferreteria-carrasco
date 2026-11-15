import { cabeceraAuth, avisarSiExpirada } from "./sesion";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");

export const productosApiHabilitada = Boolean(API_BASE_URL);

export async function solicitar(ruta, opciones = {}) {
  if (!API_BASE_URL) {
    throw new Error("La API de productos no está configurada.");
  }

  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
      ...opciones,
      headers: {
        ...(opciones.body ? { "Content-Type": "application/json" } : {}),
        ...cabeceraAuth(),
        ...opciones.headers,
      },
    });
  } catch {
    throw new Error("No se pudo conectar con el servicio de productos.");
  }

  if (!respuesta.ok) {
    avisarSiExpirada(respuesta.status);
    let detalle = `Error HTTP ${respuesta.status}`;
    try {
      const cuerpo = await respuesta.json();
      detalle = cuerpo.mensaje || detalle;
    } catch {
      // Algunas respuestas HTTP no incluyen un cuerpo JSON.
    }
    const error = new Error(detalle);
    error.status = respuesta.status;
    throw error;
  }

  if (respuesta.status === 204) return null;
  return respuesta.json();
}

export function listarProductos() {
  return solicitar("/api/productos");
}

export function crearProducto(producto) {
  return solicitar("/api/productos", {
    method: "POST",
    body: JSON.stringify(producto),
  });
}

export function actualizarProducto(codigo, producto) {
  return solicitar(`/api/productos/${encodeURIComponent(codigo)}`, {
    method: "PUT",
    body: JSON.stringify(producto),
  });
}

export function borrarProducto(codigo) {
  return solicitar(`/api/productos/${encodeURIComponent(codigo)}`, { method: "DELETE" });
}

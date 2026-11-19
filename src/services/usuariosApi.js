import { cabeceraAuth, avisarSiExpirada } from "./sesion";
import { fetchConTiempo } from "./http";
// Cliente HTTP para ms-usuarios (http://localhost:8082 por defecto).
// Usa VITE_USUARIOS_API_URL. Si no está configurada, devuelve null habilitado=false
// para que el frontend pueda operar en modo local (sin backend).

const BASE = (import.meta.env.VITE_USUARIOS_API_URL || "").trim().replace(/\/$/, "");
export const usuariosApiHabilitada = Boolean(BASE);

async function solicitar(ruta, opciones = {}) {
  if (!BASE) throw new Error("ms-usuarios no está configurado (VITE_USUARIOS_API_URL).");
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
    throw new Error("No se pudo conectar con ms-usuarios.");
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

export function iniciarSesionApi(correo, clave) {
  return solicitar("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ correo, clave }) });
}
export function registrarApi(datos) {
  return solicitar("/api/v1/auth/register", { method: "POST", body: JSON.stringify(datos) });
}
export function actualizarPerfilApi(id, datos) {
  return solicitar(`/api/v1/usuarios/${id}`, { method: "PUT", body: JSON.stringify(datos) });
}
export function listarUsuariosApi() { return solicitar("/api/v1/usuarios"); }
export function obtenerUsuarioApi(id) { return solicitar(`/api/v1/usuarios/${id}`); }
export function eliminarUsuarioApi(id) { return solicitar(`/api/v1/usuarios/${id}`, { method: "DELETE" }); }
export function cambiarRolUsuarioApi(id, tipoUsuario) {
  return solicitar(`/api/v1/usuarios/${id}/rol`, { method: "PATCH", body: JSON.stringify({ tipoUsuario }) });
}
export function listarRegionesApi() { return solicitar("/api/v1/ubicaciones/regiones"); }
export function listarComunasApi(region) { return solicitar(`/api/v1/ubicaciones/comunas?region=${encodeURIComponent(region)}`); }
export function verificarSalud() { return solicitar("/api/health"); }
export function refrescarSesionApi() { return solicitar("/api/v1/auth/refresh", { method: "POST" }); }
export function crearUsuarioApi(datos) {
  return solicitar("/api/v1/usuarios", { method: "POST", body: JSON.stringify(datos) });
}
export function editarUsuarioApi(id, datos) {
  return solicitar(`/api/v1/usuarios/${id}`, { method: "PUT", body: JSON.stringify(datos) });
}
export function cambiarEstadoUsuarioApi(id, activo) {
  return solicitar(`/api/v1/usuarios/${id}/estado`, { method: "PATCH", body: JSON.stringify({ activo }) });
}

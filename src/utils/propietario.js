export const CORREO_PROPIETARIO = (
  import.meta.env.VITE_ADMIN_CORREO || "luis.ferreteria373@gmail.com"
).trim().toLowerCase();

export function esPropietario(usuario) {
  return String(usuario?.correo || "").trim().toLowerCase() === CORREO_PROPIETARIO;
}

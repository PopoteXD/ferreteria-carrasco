const CLAVE_TOKEN = "token_carrasco";
export const EVENTO_SESION_EXPIRADA = "sesion-expirada";

export function guardarToken(token, expiraEn) {
  localStorage.setItem(CLAVE_TOKEN, JSON.stringify({ token, expira: Date.now() + (Number(expiraEn) || 0) * 1000 }));
}

export function leerToken() {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE_TOKEN) || "null");
    return v && v.token ? v : null;
  } catch {
    return null;
  }
}

export function borrarToken() {
  localStorage.removeItem(CLAVE_TOKEN);
}

export function cabeceraAuth() {
  const t = leerToken();
  return t ? { Authorization: `Bearer ${t.token}` } : {};
}

export function avisarSiExpirada(status) {
  if (status === 401 && leerToken()) {
    window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
  }
}

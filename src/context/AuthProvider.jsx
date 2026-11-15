import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { CORREO_PROPIETARIO, esPropietario } from "../utils/propietario";
import {
  usuariosApiHabilitada,
  iniciarSesionApi,
  registrarApi,
  actualizarPerfilApi,
  refrescarSesionApi,
} from "../services/usuariosApi";
import { guardarToken, leerToken, borrarToken, EVENTO_SESION_EXPIRADA } from "../services/sesion";

const CLAVE_USUARIOS = "usuarios_carrasco";
const CLAVE_SESION = "sesion_carrasco";

function leerJSON(clave, defecto) {
  try {
    const v = localStorage.getItem(clave);
    return v ? JSON.parse(v) : defecto;
  } catch {
    return defecto;
  }
}

function adminInicial() {
  return {
    run: "145202027",
    nombre: "Ferretería",
    apellidos: "Carrasco",
    correo: CORREO_PROPIETARIO,
    clave: import.meta.env.VITE_ADMIN_CLAVE || "admin123",
    tipoUsuario: "Administrador",
  };
}

function leerUsuariosLocal() {
  const guardado = localStorage.getItem(CLAVE_USUARIOS);
  if (guardado) {
    const lista = leerJSON(CLAVE_USUARIOS, []);
    let usuarios = Array.isArray(lista) ? lista : [];
    if (!usuarios.some(esPropietario)) {
      const antiguo = usuarios.find((u) => u?.correo === "admin@duoc.cl" && u.tipoUsuario === "Administrador");
      usuarios = antiguo
        ? usuarios.map((u) => (u === antiguo ? { ...u, ...adminInicial(), run: u.run } : u))
        : [adminInicial(), ...usuarios];
      localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
    }
    return usuarios;
  }
  const inicial = [adminInicial()];
  localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(inicial));
  return inicial;
}

function errorMsg(e, fallback) {
  return e?.message || fallback;
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = leerJSON(CLAVE_SESION, null);
    if (guardado && usuariosApiHabilitada) {
      const t = leerToken();
      if (!t || t.expira <= Date.now()) {
        localStorage.removeItem(CLAVE_SESION);
        borrarToken();
        return null;
      }
    }
    return guardado;
  });

  function guardarSesionApi(sesion) {
    guardarToken(sesion.token, sesion.expiraEn);
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion.usuario));
    setUsuario(sesion.usuario);
  }

  useEffect(() => {
    if (!usuariosApiHabilitada || !usuario) return undefined;
    function expirar() {
      localStorage.removeItem(CLAVE_SESION);
      borrarToken();
      setUsuario(null);
    }
    window.addEventListener(EVENTO_SESION_EXPIRADA, expirar);
    const t = leerToken();
    const restante = t ? t.expira - Date.now() : 0;
    const espera = Math.max(restante - 5 * 60 * 1000, 30 * 1000);
    const id = setTimeout(async () => {
      try {
        guardarSesionApi(await refrescarSesionApi());
      } catch {
        expirar();
      }
    }, espera);
    return () => {
      window.removeEventListener(EVENTO_SESION_EXPIRADA, expirar);
      clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id]);

  // --- Modo local (sin API) ---
  function iniciarSesionLocal(correo, clave) {
    const usuarios = leerUsuariosLocal();
    const encontrado = usuarios.find(
      (u) => u?.correo?.toLowerCase() === String(correo).trim().toLowerCase() && u?.clave === clave
    );
    if (!encontrado) return { ok: false, mensaje: "Correo o contraseña incorrectos" };
    localStorage.setItem(CLAVE_SESION, JSON.stringify(encontrado));
    setUsuario(encontrado);
    return { ok: true, usuario: encontrado };
  }

  function registrarLocal(datos) {
    const usuarios = leerUsuariosLocal();
    if (usuarios.some((u) => u.run === datos.run)) {
      return { ok: false, mensaje: "Ya existe una cuenta con ese RUN" };
    }
    if (usuarios.some((u) => String(u.correo).toLowerCase() === String(datos.correo).toLowerCase())) {
      return { ok: false, mensaje: "Ya existe una cuenta con ese correo" };
    }
    const nuevo = { ...datos, tipoUsuario: "Cliente" };
    localStorage.setItem(CLAVE_USUARIOS, JSON.stringify([...usuarios, nuevo]));
    localStorage.setItem(CLAVE_SESION, JSON.stringify(nuevo));
    setUsuario(nuevo);
    return { ok: true };
  }

  function actualizarPerfilLocal(datos) {
    if (!usuario) return { ok: false, mensaje: "No hay sesión activa" };
    const usuarios = leerUsuariosLocal();
    if (esPropietario(usuario) && String(datos.correo).toLowerCase() !== CORREO_PROPIETARIO) {
      return { ok: false, mensaje: "El correo de la cuenta propietaria no se puede cambiar" };
    }
    const runNuevo = datos.run || usuario.run;
    if (runNuevo !== usuario.run) {
      if (usuario.tipoUsuario !== "Administrador") return { ok: false, mensaje: "Solo el administrador puede cambiar su RUN" };
      if (usuarios.some((u) => u.run === runNuevo)) return { ok: false, mensaje: "Ya existe una cuenta con ese RUN" };
    }
    const correoRepetido = usuarios.some(
      (u) => u.run !== usuario.run && String(u.correo).toLowerCase() === String(datos.correo).toLowerCase()
    );
    if (correoRepetido) return { ok: false, mensaje: "Ese correo ya lo usa otra cuenta" };
    const actualizados = usuarios.map((u) => (u.run === usuario.run ? { ...u, ...datos, run: runNuevo } : u));
    const nuevoUsuario = actualizados.find((u) => u.run === runNuevo);
    localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(actualizados));
    localStorage.setItem(CLAVE_SESION, JSON.stringify(nuevoUsuario));
    setUsuario(nuevoUsuario);
    return { ok: true };
  }

  // --- API (async) ---
  const iniciarSesion = useCallback(async (correo, clave) => {
    if (!usuariosApiHabilitada) return iniciarSesionLocal(correo, clave);
    try {
      const sesion = await iniciarSesionApi(correo.trim(), clave);
      guardarSesionApi(sesion);
      return { ok: true, usuario: sesion.usuario };
    } catch (e) {
      return { ok: false, mensaje: errorMsg(e, "No se pudo iniciar sesión") };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registrar = useCallback(async (datos) => {
    if (!usuariosApiHabilitada) return registrarLocal(datos);
    try {
      const sesion = await registrarApi({
        run: datos.run,
        nombre: datos.nombre,
        apellidos: datos.apellidos,
        correo: datos.correo,
        clave: datos.clave,
        region: datos.region,
        comuna: datos.comuna,
        direccion: datos.direccion,
      });
      guardarSesionApi(sesion);
      return { ok: true };
    } catch (e) {
      return { ok: false, mensaje: errorMsg(e, "No se pudo crear la cuenta") };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actualizarPerfil = useCallback(async (datos) => {
    if (!usuariosApiHabilitada) return actualizarPerfilLocal(datos);
    try {
      // El backend (PerfilRequest) no acepta cambio de correo; se preserva el actual.
      const u = await actualizarPerfilApi(usuario.id, {
        nombre: datos.nombre,
        apellidos: datos.apellidos,
        run: datos.run,
        region: datos.region,
        comuna: datos.comuna,
        direccion: datos.direccion,
        clave: datos.clave || "",
      });
      localStorage.setItem(CLAVE_SESION, JSON.stringify(u));
      setUsuario(u);
      return { ok: true };
    } catch (e) {
      return { ok: false, mensaje: errorMsg(e, "No se pudo guardar el perfil") };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  function cerrarSesion() {
    localStorage.removeItem(CLAVE_SESION);
    borrarToken();
    setUsuario(null);
  }

  return (
    <AuthContext.Provider
      value={{ usuario, iniciarSesion, registrar, actualizarPerfil, cerrarSesion }}
    >
      {children}
    </AuthContext.Provider>
  );
}

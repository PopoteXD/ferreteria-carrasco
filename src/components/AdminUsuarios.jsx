import { useEffect, useState } from "react";
import { esPropietario } from "../utils/propietario";
import { useAuth } from "../context/AuthContext";
import {
  cambiarEstadoUsuarioApi,
  cambiarRolUsuarioApi,
  crearUsuarioApi,
  editarUsuarioApi,
  eliminarUsuarioApi,
  listarUsuariosApi,
  usuariosApiHabilitada,
} from "../services/usuariosApi";

const CLAVE_USUARIOS = "usuarios_carrasco";
const FORM_VACIO = { run: "", nombre: "", apellidos: "", correo: "", clave: "", tipoUsuario: "Cliente" };

function leer() {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE_USUARIOS) || "[]");
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function AdminUsuarios() {
  const { usuario: actual } = useAuth();
  const [usuarios, setUsuarios] = useState(() => (usuariosApiHabilitada ? [] : leer()));
  const [cargando, setCargando] = useState(usuariosApiHabilitada);
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!usuariosApiHabilitada) return undefined;
    let montado = true;
    listarUsuariosApi()
      .then((lista) => {
        if (montado) setUsuarios(lista);
      })
      .catch((e) => {
        if (montado) setError(e.message);
      })
      .finally(() => {
        if (montado) setCargando(false);
      });
    return () => {
      montado = false;
    };
  }, []);

  const esPropia = (u) => (usuariosApiHabilitada ? u.id === actual?.id : u.run === actual?.run);
  const administradores = usuarios.filter((u) => u.tipoUsuario === "Administrador").length;

  const texto = busqueda.trim().toLowerCase();
  const visibles = usuarios.filter(
    (u) =>
      !texto ||
      `${u.nombre} ${u.apellidos}`.toLowerCase().includes(texto) ||
      u.correo.toLowerCase().includes(texto) ||
      (u.run || "").toLowerCase().includes(texto)
  );

  async function cambiarRol(u, rol) {
    if (esPropietario(u)) return setError("La cuenta propietaria no se puede modificar.");
    if (esPropia(u)) return setError("No puedes cambiar tu propio rol.");
    if (u.tipoUsuario === "Administrador" && rol !== "Administrador" && administradores <= 1) {
      return setError("Debe existir al menos un administrador.");
    }
    try {
      if (usuariosApiHabilitada) {
        const actualizado = await cambiarRolUsuarioApi(u.id, rol);
        setUsuarios((lista) => lista.map((x) => (x.id === actualizado.id ? actualizado : x)));
      } else {
        const lista = usuarios.map((x) => (x.run === u.run ? { ...x, tipoUsuario: rol } : x));
        localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(lista));
        setUsuarios(lista);
      }
      setError("");
      setMensaje(`${u.nombre} ahora es ${rol}.`);
    } catch (e) {
      setMensaje("");
      setError(e.message);
    }
  }

  function abrirNuevo() {
    setForm({ ...FORM_VACIO, editando: null });
    setError("");
    setMensaje("");
  }

  function abrirEdicion(u) {
    setForm({ ...u, clave: "", editando: u });
    setError("");
    setMensaje("");
  }

  function cambiarCampo(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function guardarFormulario(e) {
    e.preventDefault();
    const edit = form.editando;
    if (!form.nombre.trim() || !form.apellidos.trim()) return setError("Nombre y apellidos son obligatorios.");
    if (!edit && (!form.run.trim() || !form.correo.trim() || !form.clave)) {
      return setError("RUN, correo y clave son obligatorios.");
    }
    if (form.clave && form.clave.length < 6) return setError("La clave debe tener al menos 6 caracteres.");
    setGuardando(true);
    try {
      if (edit) {
        const datos = {
          nombre: form.nombre.trim(),
          apellidos: form.apellidos.trim(),
          region: edit.region,
          comuna: edit.comuna,
          direccion: edit.direccion,
          clave: form.clave || "",
        };
        if (usuariosApiHabilitada) {
          const actualizado = await editarUsuarioApi(edit.id, datos);
          setUsuarios((lista) => lista.map((x) => (x.id === actualizado.id ? actualizado : x)));
        } else {
          const lista = usuarios.map((x) =>
            x.run === edit.run
              ? { ...x, nombre: datos.nombre, apellidos: datos.apellidos, ...(form.clave ? { clave: form.clave } : {}) }
              : x
          );
          localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(lista));
          setUsuarios(lista);
        }
        setMensaje("Usuario actualizado.");
      } else {
        const datos = {
          run: form.run.trim(),
          nombre: form.nombre.trim(),
          apellidos: form.apellidos.trim(),
          correo: form.correo.trim(),
          clave: form.clave,
          tipoUsuario: form.tipoUsuario,
        };
        if (usuariosApiHabilitada) {
          const creado = await crearUsuarioApi(datos);
          setUsuarios((lista) => [...lista, creado]);
        } else {
          if (usuarios.some((x) => x.run === datos.run || x.correo.toLowerCase() === datos.correo.toLowerCase())) {
            throw new Error("Ya existe un usuario con ese RUN o correo.");
          }
          const lista = [...usuarios, { ...datos, activo: true }];
          localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(lista));
          setUsuarios(lista);
        }
        setMensaje("Usuario creado.");
      }
      setError("");
      setForm(null);
    } catch (err) {
      setMensaje("");
      setError(err.errores ? `${err.message}: ${Object.values(err.errores).join(", ")}` : err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function alternarEstado(u) {
    if (esPropietario(u)) return setError("La cuenta propietaria no se puede desactivar.");
    if (esPropia(u)) return setError("No puedes desactivar tu propia cuenta.");
    const activar = u.activo === false;
    try {
      if (usuariosApiHabilitada) {
        const actualizado = await cambiarEstadoUsuarioApi(u.id, activar);
        setUsuarios((lista) => lista.map((x) => (x.id === actualizado.id ? actualizado : x)));
      } else {
        const lista = usuarios.map((x) => (x.run === u.run ? { ...x, activo: activar } : x));
        localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(lista));
        setUsuarios(lista);
      }
      setError("");
      setMensaje(`${u.nombre} ahora está ${activar ? "activo" : "inactivo"}.`);
    } catch (e) {
      setMensaje("");
      setError(e.message);
    }
  }

  async function eliminar(u) {
    if (esPropietario(u)) return setError("La cuenta propietaria no se puede eliminar.");
    if (esPropia(u)) return setError("No puedes eliminar tu propia cuenta.");
    if (u.tipoUsuario === "Administrador" && administradores <= 1) {
      return setError("Debe existir al menos un administrador.");
    }
    if (!window.confirm(`¿Eliminar la cuenta de ${u.nombre} ${u.apellidos}?`)) return;
    try {
      if (usuariosApiHabilitada) {
        await eliminarUsuarioApi(u.id);
        setUsuarios((lista) => lista.filter((x) => x.id !== u.id));
      } else {
        const lista = usuarios.filter((x) => x.run !== u.run);
        localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(lista));
        setUsuarios(lista);
      }
      setError("");
      setMensaje("Usuario eliminado.");
    } catch (e) {
      setMensaje("");
      setError(e.message);
    }
  }

  return (
    <div className="panel-admin">
      <div className="panel-admin-cabecera">
        <h2>Usuarios</h2>
        <span className="contador">{visibles.length} de {usuarios.length}</span>
      </div>

      <div className="barra-herramientas">
        <input
          type="search"
          placeholder="Buscar por nombre, correo o RUN"
          aria-label="Buscar usuarios"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button type="button" onClick={abrirNuevo}>Nuevo usuario</button>
      </div>

      {form && (
        <form className="formulario-admin" onSubmit={guardarFormulario} aria-label="Formulario de usuario">
          <h3>{form.editando ? `Editar a ${form.editando.nombre}` : "Nuevo usuario"}</h3>
          {!form.editando && (
            <>
              <label>RUN (sin puntos ni guion)
                <input name="run" value={form.run} onChange={cambiarCampo} maxLength={9} />
              </label>
              <label>Correo
                <input name="correo" type="email" value={form.correo} onChange={cambiarCampo} />
              </label>
              <label>Rol
                <select name="tipoUsuario" value={form.tipoUsuario} onChange={cambiarCampo}>
                  <option>Cliente</option>
                  <option>Administrador</option>
                </select>
              </label>
            </>
          )}
          <label>Nombre
            <input name="nombre" value={form.nombre} onChange={cambiarCampo} maxLength={50} />
          </label>
          <label>Apellidos
            <input name="apellidos" value={form.apellidos} onChange={cambiarCampo} maxLength={100} />
          </label>
          <label>{form.editando ? "Nueva clave (opcional)" : "Clave"}
            <input name="clave" type="password" value={form.clave} onChange={cambiarCampo} autoComplete="new-password" />
          </label>
          <div className="acciones-tabla">
            <button type="submit" disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</button>
            <button type="button" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </form>
      )}

      {error && <div className="aviso error" role="alert">{error}</div>}
      {mensaje && !error && <div className="aviso exito" role="status">{mensaje}</div>}
      {cargando && <p>Cargando usuarios...</p>}

      <table className="tabla-admin">
        <thead>
          <tr><th>RUN</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {visibles.length === 0 && <tr><td colSpan="6">No hay usuarios que coincidan.</td></tr>}
          {visibles.map((u) => (
            <tr key={usuariosApiHabilitada ? u.id : u.run}>
              <td>{u.run}</td>
              <td>{u.nombre} {u.apellidos}</td>
              <td>{u.correo}</td>
              <td>
                {esPropietario(u) ? (
                  <span className="pastilla estado-vigente">👑 Propietario</span>
                ) : (
                  <select
                    aria-label={`Rol de ${u.nombre} ${u.apellidos}`}
                    value={u.tipoUsuario}
                    onChange={(e) => cambiarRol(u, e.target.value)}
                  >
                    <option>Cliente</option>
                    <option>Administrador</option>
                  </select>
                )}
              </td>
              <td>
                <span className={`pastilla ${u.activo === false ? "estado-vencida" : "estado-vigente"}`}>
                  {u.activo === false ? "Inactivo" : "Activo"}
                </span>
              </td>
              <td className="acciones-tabla">
                <button type="button" onClick={() => abrirEdicion(u)}>Editar</button>
                {!esPropietario(u) && !esPropia(u) && (
                  <button type="button" onClick={() => alternarEstado(u)}>
                    {u.activo === false ? "Activar" : "Desactivar"}
                  </button>
                )}
                {!esPropietario(u) && (
                  <button type="button" className="eliminar" onClick={() => eliminar(u)}>Eliminar</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminUsuarios;

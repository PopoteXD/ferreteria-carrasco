import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { esCorreoValido, esRunValido } from "../utils/validaciones";
import { esPropietario } from "../utils/propietario";
import RegionComuna from "./RegionComuna";

function Perfil() {
  const { usuario, actualizarPerfil } = useAuth();

  const [form, setForm] = useState({
    run: usuario?.run || "",
    nombre: usuario?.nombre || "",
    apellidos: usuario?.apellidos || "",
    correo: usuario?.correo || "",
    claveNueva: "",
    region: usuario?.region || "",
    comuna: usuario?.comuna || "",
    direccion: usuario?.direccion || "",
  });
  const [errores, setErrores] = useState({});
  const [verClave, setVerClave] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  // si no hay sesion, se manda al login
  if (!usuario) return <Navigate to="/login" />;

  const esAdminUsuario = usuario.tipoUsuario === "Administrador";
  const propietario = esPropietario(usuario);

  function cambiar(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value, ...(name === "region" ? { comuna: "" } : {}) });
  }

  function enviar(e) {
    e.preventDefault();

    const nuevos = {};
    if (esAdminUsuario && !esRunValido(form.run)) nuevos.run = "RUN no válido (sin puntos ni guion, ej: 190110228)";
    if (form.nombre.trim() === "") nuevos.nombre = "El nombre es obligatorio";
    if (form.apellidos.trim() === "") nuevos.apellidos = "Los apellidos son obligatorios";
    if (!esCorreoValido(form.correo)) nuevos.correo = "Usa un correo @duoc.cl, @profesor.duoc.cl o @gmail.com";
    if (form.claveNueva !== "" && (form.claveNueva.length < 4 || form.claveNueva.length > 10)) {
      nuevos.claveNueva = "Debe tener entre 4 y 10 caracteres";
    }
    if (form.region === "") nuevos.region = "Elige una región";
    if (form.comuna === "") nuevos.comuna = "Elige una comuna";
    if (form.direccion.trim() === "") nuevos.direccion = "La dirección es obligatoria";

    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    const datos = {
      ...(esAdminUsuario ? { run: form.run.trim().toUpperCase() } : {}),
      nombre: form.nombre.trim(),
      apellidos: form.apellidos.trim(),
      correo: form.correo.trim(),
      region: form.region,
      comuna: form.comuna,
      direccion: form.direccion.trim(),
    };
    // la clave nueva es opcional: si queda vacia, se mantiene la anterior
    if (form.claveNueva !== "") datos.clave = form.claveNueva;

    const resultado = actualizarPerfil(datos);
    if (!resultado.ok) {
      setMensaje({ tipo: "error", texto: resultado.mensaje });
      return;
    }
    setForm({ ...form, claveNueva: "" });
    setMensaje({ tipo: "exito", texto: "Tus datos se guardaron correctamente" });
  }

  const esAdmin = usuario.tipoUsuario === "Administrador";
  const iniciales = `${usuario.nombre?.[0] || ""}${usuario.apellidos?.[0] || ""}`.toUpperCase();
  const fuerza = fuerzaClave(form.claveNueva);
  const hayCambios =
    form.claveNueva !== "" ||
    ["run", "nombre", "apellidos", "correo", "region", "comuna", "direccion"].some(
      (k) => form[k] !== (usuario[k] || "")
    );

  const campoTexto = (name, label, type = "text", maxLength = 100, extra = {}) => (
    <div className="campo-formulario">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        maxLength={maxLength}
        value={form[name]}
        onChange={cambiar}
        className={errores[name] ? "campo-invalido" : ""}
        {...extra}
      />
      {errores[name] && <small className="texto-error visible">{errores[name]}</small>}
    </div>
  );

  return (
    <section className="seccion">
      <div className="contenedor perfil-pagina">
        <header className={`perfil-cabecera ${esAdmin ? "es-admin" : ""}`}>
          <div className="perfil-avatar" aria-hidden="true">
            <span className="perfil-avatar-icono">{esAdmin ? "🛡️" : "👤"}</span>
            <span className="perfil-avatar-iniciales">{iniciales}</span>
          </div>
          <div className="perfil-resumen">
            <h1>{usuario.nombre} {usuario.apellidos}</h1>
            <p>{usuario.correo}</p>
            <div className="perfil-insignias">
              <span className={`perfil-rol ${esAdmin ? "admin" : "cliente"}`}>
                {esAdmin ? "🛡️ Administrador" : "🛒 Cliente"}
              </span>
              <span className="perfil-run">RUN: <strong>{usuario.run}</strong></span>
              {propietario && <span className="perfil-run">👑 Propietario de la tienda</span>}
            </div>
          </div>
          <div className="perfil-accesos">
            {esAdmin ? (
              <>
                <Link to="/admin" className="btn btn-primario btn-sm">📊 Panel admin</Link>
                <Link to="/admin/productos" className="btn btn-secundario btn-sm">📦 Productos</Link>
                <Link to="/admin/ofertas" className="btn btn-secundario btn-sm">🏷️ Ofertas</Link>
              </>
            ) : (
              <>
                <Link to="/productos" className="btn btn-primario btn-sm">🔧 Ver productos</Link>
                <Link to="/ofertas" className="btn btn-secundario btn-sm">🏷️ Ofertas</Link>
                <Link to="/carrito" className="btn btn-secundario btn-sm">🛒 Mi carrito</Link>
              </>
            )}
          </div>
        </header>

        {mensaje.texto && <div className={`aviso ${mensaje.tipo}`} role="status">{mensaje.texto}</div>}

        <form onSubmit={enviar} noValidate className="perfil-formulario">
          <div className="perfil-tarjeta">
            <h2>🙍 Datos personales</h2>
            <div className="perfil-fila">
              {campoTexto("nombre", "Nombre", "text", 50)}
              {campoTexto("apellidos", "Apellidos")}
            </div>
            {esAdminUsuario && campoTexto("run", "RUN (sin puntos ni guion)", "text", 9)}
            {campoTexto("correo", "Correo electronico", "email", 100, propietario ? { readOnly: true } : {})}
            {propietario && <small>El correo del propietario no se puede cambiar.</small>}
          </div>

          <div className="perfil-tarjeta">
            <h2>📍 Dirección de despacho</h2>
            <RegionComuna
              region={form.region}
              comuna={form.comuna}
              onChange={cambiar}
              errores={errores}
            />
            {campoTexto("direccion", "Dirección", "text", 300)}
          </div>

          <div className="perfil-tarjeta">
            <h2>🔒 Seguridad</h2>
            <div className="campo-formulario">
              <label htmlFor="claveNueva">Nueva contraseña (vacío para no cambiarla)</label>
              <div className="perfil-clave">
                <input
                  id="claveNueva"
                  name="claveNueva"
                  type={verClave ? "text" : "password"}
                  maxLength={10}
                  value={form.claveNueva}
                  onChange={cambiar}
                  className={errores.claveNueva ? "campo-invalido" : ""}
                />
                <button type="button" className="enlace-boton" onClick={() => setVerClave(!verClave)}>
                  {verClave ? "Ocultar" : "Ver"}
                </button>
              </div>
              {form.claveNueva !== "" && (
                <div className={`perfil-fuerza nivel-${fuerza.nivel}`} aria-live="polite">
                  <span className="perfil-fuerza-barra"><i /></span>
                  <small>Seguridad: {fuerza.texto}</small>
                </div>
              )}
              {errores.claveNueva && <small className="texto-error visible">{errores.claveNueva}</small>}
            </div>
          </div>

          <div className="perfil-barra-guardar">
            <small>{hayCambios ? "● Tienes cambios sin guardar" : "✓ Todo al día"}</small>
            <button type="submit" className="btn btn-primario" disabled={!hayCambios}>
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function fuerzaClave(clave) {
  let puntos = 0;
  if (clave.length >= 6) puntos++;
  if (/[A-Z]/.test(clave) && /[a-z]/.test(clave)) puntos++;
  if (/\d/.test(clave)) puntos++;
  if (/[^A-Za-z0-9]/.test(clave)) puntos++;
  const textos = ["muy débil", "débil", "media", "buena", "fuerte"];
  return { nivel: puntos, texto: textos[puntos] };
}

export default Perfil;

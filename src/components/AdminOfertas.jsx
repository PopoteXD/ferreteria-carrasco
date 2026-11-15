import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProductos } from "../context/ProductsContext";
import { useOfertas } from "../context/OfertasContext";
import {
  descripcionAlcance,
  descripcionDescuento,
  descripcionVigencia,
  estadoOferta,
  productosAfectados,
} from "../utils/ofertas";

const ESTADOS = ["Todas", "Vigente", "Programada", "Vencida", "Inactiva"];

function AdminOfertas() {
  const navigate = useNavigate();
  const { productos } = useProductos();
  const {
    ofertas,
    precioDe,
    cargandoOfertas,
    errorOfertas,
    recargarOfertas,
    agregarOferta,
    eliminarOferta,
    alternarActiva,
  } = useOfertas();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("Todas");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const conEstado = ofertas.map((o) => ({ ...o, estado: estadoOferta(o) }));
  const texto = busqueda.trim().toLowerCase();
  const visibles = conEstado.filter(
    (o) =>
      (filtro === "Todas" || o.estado === filtro) &&
      (!texto || o.nombre.toLowerCase().includes(texto) || (o.etiqueta ?? "").toLowerCase().includes(texto))
  );

  const vigentes = conEstado.filter((o) => o.estado === "Vigente").length;
  const programadas = conEstado.filter((o) => o.estado === "Programada").length;
  const productosEnOferta = productos.filter((p) => precioDe(p).oferta).length;

  function avisar(resultado, textoOk) {
    if (resultado.ok) {
      setError("");
      setMensaje(textoOk);
    } else {
      setMensaje("");
      setError(resultado.mensaje);
    }
  }

  async function alternar(o) {
    const activar = !o.activa;
    avisar(await alternarActiva(o.id, activar), activar ? `«${o.nombre}» activada.` : `«${o.nombre}» pausada.`);
  }

  async function eliminar(o) {
    if (!window.confirm(`¿Eliminar la oferta «${o.nombre}»? Los productos volverán a su precio normal.`)) return;
    avisar(await eliminarOferta(o.id), "Oferta eliminada.");
  }

  async function duplicar(o) {
    // eslint-disable-next-line no-unused-vars
    const { id, estado, ...datos } = o;
    const resultado = await agregarOferta({ ...datos, nombre: `${o.nombre} (copia)`, activa: false });
    if (resultado.ok) navigate(`/admin/ofertas/editar/${resultado.oferta.id}`);
    else avisar(resultado, "");
  }

  return (
    <>
      <div className="tarjetas-metricas">
        <div className="tarjeta-metrica"><strong>{vigentes}</strong><span>Ofertas vigentes</span></div>
        <div className="tarjeta-metrica"><strong>{programadas}</strong><span>Programadas</span></div>
        <div className="tarjeta-metrica"><strong>{productosEnOferta}</strong><span>Productos en oferta hoy</span></div>
      </div>

      <div className="panel-admin">
        <div className="panel-admin-cabecera">
          <h2>Ofertas</h2>
          <div className="grupo-botones">
            <span className="contador">{visibles.length} de {ofertas.length}</span>
            <Link to="/admin/ofertas/nueva" className="btn btn-primario btn-sm">+ Nueva oferta</Link>
          </div>
        </div>

        <div className="barra-herramientas">
          <input
            type="search"
            placeholder="Buscar oferta por nombre o etiqueta"
            aria-label="Buscar ofertas"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select aria-label="Filtrar por estado" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            {ESTADOS.map((e) => <option key={e}>{e}</option>)}
          </select>
        </div>

        {errorOfertas && (
          <div className="aviso error" role="alert">
            No se pudieron cargar las ofertas: {errorOfertas}{" "}
            <button type="button" className="btn btn-secundario btn-sm" onClick={recargarOfertas}>Reintentar</button>
          </div>
        )}
        {error && <div className="aviso error" role="alert">{error}</div>}
        {mensaje && !error && <div className="aviso exito" role="status">{mensaje}</div>}
        {cargandoOfertas && <p style={{ padding: "0 24px" }}>Cargando ofertas...</p>}

        <table className="tabla-admin">
          <thead>
            <tr>
              <th>Oferta</th><th>Descuento</th><th>Aplica a</th><th>Vigencia</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 && (
              <tr>
                <td colSpan="6">
                  {ofertas.length === 0
                    ? "Aún no creas ninguna oferta. Usa «+ Nueva oferta» para empezar."
                    : "No hay ofertas que coincidan."}
                </td>
              </tr>
            )}
            {visibles.map((o) => (
              <tr key={o.id}>
                <td>
                  <span className="punto-color" style={{ backgroundColor: o.color || "#d92d20" }} aria-hidden="true" />
                  <strong>{o.nombre}</strong>
                  {o.destacada && <span className="pastilla ok" style={{ marginLeft: 8 }}>Portada</span>}
                  {o.etiqueta && <><br /><small>Etiqueta: {o.etiqueta}</small></>}
                </td>
                <td>{descripcionDescuento(o)}</td>
                <td>
                  {descripcionAlcance(o)}
                  <br /><small>{productosAfectados(o, productos).length} producto(s) del catálogo</small>
                </td>
                <td>{descripcionVigencia(o)}</td>
                <td><span className={`pastilla estado-${o.estado.toLowerCase()}`}>{o.estado}</span></td>
                <td className="acciones-tabla">
                  <Link to={`/admin/ofertas/editar/${o.id}`}>Editar</Link>
                  <button type="button" onClick={() => alternar(o)}>{o.activa ? "Pausar" : "Activar"}</button>
                  <button type="button" onClick={() => duplicar(o)}>Duplicar</button>
                  <button type="button" className="eliminar" onClick={() => eliminar(o)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default AdminOfertas;

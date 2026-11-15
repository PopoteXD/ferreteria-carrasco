import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CATEGORIAS, formatoCLP } from "../data/productos";
import { useProductos } from "../context/ProductsContext";
import { useOfertas } from "../context/OfertasContext";
import {
  ALCANCES,
  COLORES_OFERTA,
  TIPOS_DESCUENTO,
  aplicarOferta,
  descripcionDescuento,
  descripcionVigencia,
  hoyISO,
  productosAfectados,
  sumarDias,
} from "../utils/ofertas";

const VACIA = {
  nombre: "",
  descripcion: "",
  etiqueta: "",
  color: COLORES_OFERTA[0],
  tipo: "PORCENTAJE",
  valor: "",
  alcance: "TODOS",
  categorias: [],
  productos: [],
  inicio: "",
  fin: "",
  activa: true,
  destacada: false,
};

function alternar(lista, valor) {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}

function FormularioOferta({ existente }) {
  const navigate = useNavigate();
  const { productos } = useProductos();
  const { agregarOferta, editarOferta } = useOfertas();
  const esEdicion = Boolean(existente);

  const [form, setForm] = useState(() =>
    existente
      ? {
          ...VACIA,
          ...existente,
          valor: String(existente.valor ?? ""),
          etiqueta: existente.etiqueta ?? "",
          descripcion: existente.descripcion ?? "",
          color: existente.color || VACIA.color,
          categorias: existente.categorias ?? [],
          productos: existente.productos ?? [],
          inicio: existente.inicio ?? "",
          fin: existente.fin ?? "",
        }
      : VACIA
  );
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [busquedaProducto, setBusquedaProducto] = useState("");

  const cambiar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const tipo = TIPOS_DESCUENTO.find((t) => t.id === form.tipo);

  function validar() {
    const e = {};
    if (form.nombre.trim() === "") e.nombre = "Ponle un nombre a la oferta";
    const valor = String(form.valor).trim();
    if (!/^\d+$/.test(valor) || Number(valor) < 1) e.valor = "Ingresa un número entero mayor a 0";
    else if (form.tipo === "PORCENTAJE" && Number(valor) > 99) e.valor = "El porcentaje va de 1 a 99";
    if (form.alcance === "CATEGORIA" && form.categorias.length === 0) e.alcance = "Elige al menos una categoría";
    if (form.alcance === "PRODUCTOS" && form.productos.length === 0) e.alcance = "Elige al menos un producto";
    if (form.inicio && form.fin && form.fin < form.inicio) e.fin = "El término no puede ser anterior al inicio";
    return e;
  }

  async function enviar(ev) {
    ev.preventDefault();
    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    const datos = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      etiqueta: form.etiqueta.trim(),
      color: form.color,
      tipo: form.tipo,
      valor: Number(form.valor),
      alcance: form.alcance,
      categorias: form.alcance === "CATEGORIA" ? form.categorias : [],
      productos: form.alcance === "PRODUCTOS" ? form.productos : [],
      inicio: form.inicio || null,
      fin: form.fin || null,
      activa: form.activa,
      destacada: form.destacada,
    };

    setGuardando(true);
    setErrorGeneral("");
    try {
      const resultado = esEdicion ? await editarOferta(existente.id, datos) : await agregarOferta(datos);
      if (!resultado.ok) {
        setErrorGeneral(resultado.mensaje);
        return;
      }
      navigate("/admin/ofertas");
    } finally {
      setGuardando(false);
    }
  }

  // ----- vista previa -----
  const ofertaPrevia = { ...form, valor: Number(form.valor) || 0, id: 0, activa: true };
  const afectados = productosAfectados(ofertaPrevia, productos);
  const hayValor = Number(form.valor) > 0;
  const filasPrevia = afectados.slice(0, 5).map((p) => ({
    producto: p,
    antes: p.precio,
    despues: hayValor ? aplicarOferta(ofertaPrevia, p.precio) : p.precio,
  }));
  const sinEfecto = hayValor ? afectados.filter((p) => aplicarOferta(ofertaPrevia, p.precio) >= p.precio).length : 0;
  const etiquetaPrevia =
    form.etiqueta.trim() ||
    (hayValor && form.tipo === "PORCENTAJE" ? `-${form.valor}%` : hayValor ? descripcionDescuento(ofertaPrevia) : "OFERTA");

  const textoBusqueda = busquedaProducto.trim().toLowerCase();
  const productosVisibles = productos.filter(
    (p) => !textoBusqueda || p.nombre.toLowerCase().includes(textoBusqueda) || p.codigo.toLowerCase().includes(textoBusqueda)
  );

  const hoy = hoyISO();

  return (
    <div className="admin-form-con-vista">
      <div className="tarjeta-formulario">
        <h2>{esEdicion ? "Editar oferta" : "Nueva oferta"}</h2>
        {errorGeneral && <div className="aviso error" role="alert">{errorGeneral}</div>}

        <form onSubmit={enviar} noValidate>
          <div className="campo-formulario">
            <label htmlFor="nombre">Nombre de la oferta</label>
            <input
              id="nombre"
              value={form.nombre}
              maxLength={80}
              placeholder="Ej: Semana del maestro"
              onChange={(e) => cambiar("nombre", e.target.value)}
              className={errores.nombre ? "campo-invalido" : ""}
            />
            {errores.nombre && <small className="texto-error visible">{errores.nombre}</small>}
          </div>

          <div className="campo-formulario">
            <label htmlFor="descripcion">Descripción (se muestra en el banner)</label>
            <textarea
              id="descripcion"
              rows={2}
              maxLength={300}
              value={form.descripcion}
              onChange={(e) => cambiar("descripcion", e.target.value)}
            />
          </div>

          <fieldset className="grupo-campos">
            <legend>Descuento</legend>
            <div className="opciones-tarjeta" role="radiogroup" aria-label="Tipo de descuento">
              {TIPOS_DESCUENTO.map((t) => (
                <label key={t.id} className={form.tipo === t.id ? "seleccionada" : ""}>
                  <input
                    type="radio"
                    name="tipo"
                    value={t.id}
                    checked={form.tipo === t.id}
                    onChange={() => cambiar("tipo", t.id)}
                  />
                  <strong>{t.nombre}</strong>
                  <small>{t.ayuda}</small>
                </label>
              ))}
            </div>
            <div className="campo-formulario">
              <label htmlFor="valor">Valor ({tipo.unidad})</label>
              <input
                id="valor"
                type="number"
                min="1"
                max={form.tipo === "PORCENTAJE" ? 99 : undefined}
                value={form.valor}
                onChange={(e) => cambiar("valor", e.target.value)}
                className={errores.valor ? "campo-invalido" : ""}
              />
              {errores.valor && <small className="texto-error visible">{errores.valor}</small>}
            </div>
          </fieldset>

          <fieldset className="grupo-campos">
            <legend>¿A qué productos aplica?</legend>
            <div className="opciones-tarjeta" role="radiogroup" aria-label="Alcance de la oferta">
              {ALCANCES.map((a) => (
                <label key={a.id} className={form.alcance === a.id ? "seleccionada" : ""}>
                  <input
                    type="radio"
                    name="alcance"
                    value={a.id}
                    checked={form.alcance === a.id}
                    onChange={() => cambiar("alcance", a.id)}
                  />
                  <strong>{a.nombre}</strong>
                </label>
              ))}
            </div>

            {form.alcance === "CATEGORIA" && (
              <div className="lista-seleccion">
                {CATEGORIAS.map((c) => (
                  <label key={c.id} className="casilla">
                    <input
                      type="checkbox"
                      checked={form.categorias.includes(c.id)}
                      onChange={() => cambiar("categorias", alternar(form.categorias, c.id))}
                    />
                    {c.nombre}
                  </label>
                ))}
              </div>
            )}

            {form.alcance === "PRODUCTOS" && (
              <>
                <div className="barra-seleccion">
                  <input
                    type="search"
                    placeholder="Buscar producto por nombre o código"
                    aria-label="Buscar producto para la oferta"
                    value={busquedaProducto}
                    onChange={(e) => setBusquedaProducto(e.target.value)}
                  />
                  <button
                    type="button"
                    className="enlace-boton"
                    onClick={() =>
                      cambiar("productos", [...new Set([...form.productos, ...productosVisibles.map((p) => p.codigo)])])
                    }
                  >
                    Seleccionar visibles
                  </button>
                  <button type="button" className="enlace-boton" onClick={() => cambiar("productos", [])}>
                    Limpiar
                  </button>
                </div>
                <div className="lista-seleccion alta">
                  {productosVisibles.length === 0 && <small>No hay productos que coincidan.</small>}
                  {productosVisibles.map((p) => (
                    <label key={p.codigo} className="casilla">
                      <input
                        type="checkbox"
                        checked={form.productos.includes(p.codigo)}
                        onChange={() => cambiar("productos", alternar(form.productos, p.codigo))}
                      />
                      {p.nombre} <small>({p.codigo} · {formatoCLP(p.precio)})</small>
                    </label>
                  ))}
                </div>
                <small>{form.productos.length} producto(s) seleccionado(s)</small>
              </>
            )}
            {errores.alcance && <small className="texto-error visible">{errores.alcance}</small>}
          </fieldset>

          <fieldset className="grupo-campos">
            <legend>Vigencia</legend>
            <div className="fila-campos">
              <div className="campo-formulario">
                <label htmlFor="inicio">Inicio (opcional)</label>
                <input id="inicio" type="date" value={form.inicio} onChange={(e) => cambiar("inicio", e.target.value)} />
              </div>
              <div className="campo-formulario">
                <label htmlFor="fin">Término (opcional)</label>
                <input
                  id="fin"
                  type="date"
                  value={form.fin}
                  onChange={(e) => cambiar("fin", e.target.value)}
                  className={errores.fin ? "campo-invalido" : ""}
                />
                {errores.fin && <small className="texto-error visible">{errores.fin}</small>}
              </div>
            </div>
            <div className="barra-seleccion">
              <button type="button" className="enlace-boton" onClick={() => setForm((f) => ({ ...f, inicio: hoy, fin: sumarDias(hoy, 7) }))}>
                Hoy + 7 días
              </button>
              <button type="button" className="enlace-boton" onClick={() => setForm((f) => ({ ...f, inicio: hoy, fin: sumarDias(hoy, 30) }))}>
                Hoy + 30 días
              </button>
              <button type="button" className="enlace-boton" onClick={() => setForm((f) => ({ ...f, inicio: "", fin: "" }))}>
                Sin fechas
              </button>
            </div>
          </fieldset>

          <fieldset className="grupo-campos">
            <legend>Apariencia</legend>
            <div className="campo-formulario">
              <label htmlFor="etiqueta">Etiqueta de la cinta (opcional)</label>
              <input
                id="etiqueta"
                value={form.etiqueta}
                maxLength={30}
                placeholder="Si la dejas vacía se usa el % real, ej: -20%"
                onChange={(e) => cambiar("etiqueta", e.target.value)}
              />
            </div>
            <div className="campo-formulario">
              <span className="etiqueta-campo">Color</span>
              <div className="selector-color">
                {COLORES_OFERTA.map((c) => (
                  <button
                    type="button"
                    key={c}
                    className={form.color === c ? "activo" : ""}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                    aria-pressed={form.color === c}
                    onClick={() => cambiar("color", c)}
                  />
                ))}
                <input
                  type="color"
                  aria-label="Color personalizado"
                  value={form.color}
                  onChange={(e) => cambiar("color", e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          <div className="interruptores">
            <label className="casilla">
              <input type="checkbox" checked={form.activa} onChange={(e) => cambiar("activa", e.target.checked)} />
              Oferta activa (publicada en la tienda dentro de su vigencia)
            </label>
            <label className="casilla">
              <input type="checkbox" checked={form.destacada} onChange={(e) => cambiar("destacada", e.target.checked)} />
              Destacar en la portada
            </label>
          </div>

          <button type="submit" className="btn btn-primario" disabled={guardando}>
            {guardando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear oferta"}
          </button>{" "}
          <Link to="/admin/ofertas" className="btn btn-secundario">Cancelar</Link>
        </form>
      </div>

      <aside className="vista-previa" aria-label="Vista previa de la oferta">
        <h3>Vista previa</h3>
        <p className="vista-previa-nota">Así verán la oferta tus clientes.</p>

        <div className="banner-oferta sin-accion" style={{ backgroundColor: form.color }}>
          <span className="banner-oferta-valor">{etiquetaPrevia}</span>
          <strong>{form.nombre.trim() || "Nombre de la oferta"}</strong>
          {form.descripcion.trim() && <span className="banner-oferta-texto">{form.descripcion}</span>}
          <span className="banner-oferta-plazo">{descripcionVigencia(form)}</span>
        </div>

        <h4>
          Productos afectados: {afectados.length}
        </h4>
        {afectados.length === 0 ? (
          <p className="vista-previa-nota">Ningún producto del catálogo coincide con esta selección.</p>
        ) : (
          <ul className="previa-productos">
            {filasPrevia.map(({ producto, antes, despues }) => (
              <li key={producto.codigo}>
                <img src={producto.imagen} alt="" />
                <span>{producto.nombre}</span>
                <span className="previa-precios">
                  {despues < antes && <s>{formatoCLP(antes)}</s>}
                  <strong>{formatoCLP(despues)}</strong>
                </span>
              </li>
            ))}
            {afectados.length > filasPrevia.length && (
              <li className="previa-mas">y {afectados.length - filasPrevia.length} producto(s) más…</li>
            )}
          </ul>
        )}
        {sinEfecto > 0 && (
          <p className="aviso error">
            {sinEfecto} producto(s) ya cuestan igual o menos que este precio, así que no tendrán descuento.
          </p>
        )}
        <p className="vista-previa-nota">
          Si un producto entra en varias ofertas vigentes, se aplica la que deje el precio más bajo (no se acumulan).
        </p>
      </aside>
    </div>
  );
}

function AdminOfertaForm() {
  const { id } = useParams();
  const { ofertas, cargandoOfertas } = useOfertas();

  if (!id) return <FormularioOferta />;

  const existente = ofertas.find((o) => String(o.id) === id);
  if (!existente && cargandoOfertas) return <p role="status">Cargando oferta...</p>;
  if (!existente) {
    return <p>No encontramos esa oferta. <Link to="/admin/ofertas">Volver al listado</Link></p>;
  }
  return <FormularioOferta key={id} existente={existente} />;
}

export default AdminOfertaForm;

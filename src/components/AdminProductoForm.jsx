import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CATEGORIAS } from "../data/productos";
import { useProductos } from "../context/ProductsContext";
import { useOfertas } from "../context/OfertasContext";
import { etiquetaOferta } from "../utils/ofertas";
import PrecioProducto from "./PrecioProducto";

const VACIO = {
  codigo: "", nombre: "", categoria: "", precio: "",
  stock: "", stockCritico: "", descripcion: "", imagen: "",
};

function AdminProductoForm() {
  const { codigo } = useParams();
  const esEdicion = Boolean(codigo);
  const navigate = useNavigate();
  const {
    productos,
    agregarProducto,
    editarProducto,
    cargandoProductos,
    errorProductos,
    recargarProductos,
  } = useProductos();

  const { precioDe } = useOfertas();

  const existente = esEdicion ? productos.find((p) => p.codigo === codigo) : null;

  // si es edicion, el formulario parte con los datos del producto
  const [form, setForm] = useState(() =>
    existente
      ? { ...VACIO, ...existente, stockCritico: existente.stockCritico ?? "" }
      : VACIO
  );
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);

  if (esEdicion && cargandoProductos) {
    return <p role="status">Cargando producto...</p>;
  }

  if (esEdicion && errorProductos) {
    return (
      <div className="aviso error" role="alert">
        No se pudo cargar el producto: {errorProductos}{" "}
        <button type="button" className="btn btn-secundario" onClick={recargarProductos}>
          Reintentar
        </button>
      </div>
    );
  }

  if (esEdicion && !existente) {
    return (
      <p>
        No encontramos ese producto. <Link to="/admin/productos">Volver al listado</Link>
      </p>
    );
  }

  function cambiar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validar() {
    const e = {};
    if (String(form.codigo).trim().length < 3) e.codigo = "Mínimo 3 caracteres";
    if (String(form.nombre).trim() === "") e.nombre = "El nombre es obligatorio";
    else if (form.nombre.length > 100) e.nombre = "Máximo 100 caracteres";
    if (form.categoria === "") e.categoria = "Elige una categoría";

    const precio = String(form.precio).trim();
    if (precio === "" || isNaN(Number(precio)) || Number(precio) < 0) e.precio = "Ingresa un precio válido";

    if (!/^\d+$/.test(String(form.stock).trim())) e.stock = "Solo números enteros";

    const critico = String(form.stockCritico).trim();
    if (critico !== "" && !/^\d+$/.test(critico)) e.stockCritico = "Solo números enteros";

    if (String(form.descripcion).length > 500) e.descripcion = "Máximo 500 caracteres";
    return e;
  }

  async function enviar(ev) {
    ev.preventDefault();

    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    const datos = {
      codigo: String(form.codigo).trim().toUpperCase(),
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      precio: Number(form.precio),
      stock: parseInt(form.stock, 10),
      stockCritico: String(form.stockCritico).trim() === "" ? null : parseInt(form.stockCritico, 10),
      descripcion: String(form.descripcion).trim(),
      imagen: String(form.imagen).trim() || "/img/productos/sin-foto.png",
    };

    setGuardando(true);
    setErrorGeneral("");
    try {
      const resultado = esEdicion
        ? await editarProducto(codigo, datos)
        : await agregarProducto(datos);
      if (resultado && !resultado.ok) {
        setErrorGeneral(resultado.mensaje);
        return;
      }
      navigate("/admin/productos");
    } catch (error) {
      setErrorGeneral(error.message || "No se pudo guardar el producto.");
    } finally {
      setGuardando(false);
    }
  }

  const campo = (name, label, type = "text", extra = {}) => (
    <div className="campo-formulario">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={form[name]}
        onChange={cambiar}
        className={errores[name] ? "campo-invalido" : ""}
        {...extra}
      />
      {errores[name] && <small className="texto-error visible">{errores[name]}</small>}
    </div>
  );

  const categoriaNombre = CATEGORIAS.find((c) => c.id === form.categoria)?.nombre || "Categoría";
  const productoPrevia = {
    ...form,
    codigo: String(form.codigo).trim().toUpperCase(),
    precio: Number(form.precio) || 0,
  };
  const info = precioDe(productoPrevia);
  const nombrePrevia = form.nombre.trim() || "Nombre del producto";
  const descripcionPrevia = String(form.descripcion).trim() || "Aquí aparecerá la descripción del producto.";
  const stockNum = String(form.stock).trim() === "" ? null : Number(form.stock);
  const criticoNum = String(form.stockCritico).trim() === "" ? null : Number(form.stockCritico);
  const agotado = stockNum !== null && stockNum <= 0;
  const pocas = stockNum !== null && !agotado && criticoNum !== null && stockNum <= criticoNum;
  const imagenPrevia = String(form.imagen).trim() || "/img/productos/sin-foto.png";
  const colorOferta = info.oferta?.color ? { backgroundColor: info.oferta.color } : undefined;

  return (
    <div className="admin-form-con-vista">
    <div className="tarjeta-formulario" style={{ maxWidth: "700px", margin: 0 }}>
      <h2>{esEdicion ? "Editar producto" : "Nuevo producto"}</h2>

      {errorGeneral && <div className="aviso error">{errorGeneral}</div>}

      <form onSubmit={enviar} noValidate>
        {campo("codigo", "Código", "text", { placeholder: "Ej: HM005", disabled: esEdicion })}

        <div className="campo-formulario">
          <label htmlFor="categoria">Categoría</label>
          <select
            id="categoria"
            name="categoria"
            value={form.categoria}
            onChange={cambiar}
            className={errores.categoria ? "campo-invalido" : ""}
          >
            <option value="">Selecciona una categoría</option>
            {CATEGORIAS.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          {errores.categoria && <small className="texto-error visible">{errores.categoria}</small>}
        </div>

        {campo("nombre", "Nombre", "text", { maxLength: 100 })}

        <div className="campo-formulario">
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            name="descripcion"
            rows={3}
            maxLength={500}
            value={form.descripcion}
            onChange={cambiar}
          />
          {errores.descripcion && <small className="texto-error visible">{errores.descripcion}</small>}
        </div>

        {campo("precio", "Precio (CLP)", "number", { min: 0 })}
        {campo("stock", "Stock", "number", { min: 0 })}
        {campo("stockCritico", "Stock crítico (opcional)", "number", { min: 0 })}
        {campo("imagen", "Ruta de la imagen", "text", { placeholder: "/img/productos/mi-foto.jpg" })}

        <button type="submit" className="btn btn-primario" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar producto"}
        </button>{" "}
        <Link to="/admin/productos" className="btn btn-secundario">Cancelar</Link>
      </form>
    </div>

    <aside className="vista-previa" aria-label="Vista previa del producto">
      <h3>Vista previa</h3>
      <p className="vista-previa-nota">Así se verá el producto en la tienda antes de publicarlo.</p>

      <h4>En el catálogo</h4>
      <div className="tarjeta-producto previa-estatica">
        <div className="miniatura">
          <img
            src={imagenPrevia}
            alt={nombrePrevia}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/img/productos/sin-foto.png"; }}
          />
          {info.oferta && (
            <span className="cinta-oferta" style={colorOferta}>{etiquetaOferta(info.oferta, info)}</span>
          )}
        </div>
        <div className="cuerpo">
          <h3>{nombrePrevia}</h3>
          <span className="codigo">Codigo: {productoPrevia.codigo || "—"}</span>
          <PrecioProducto info={info} />
          {stockNum !== null && <span className="codigo">Stock disponible: {stockNum}</span>}
        </div>
        <div className="acciones-tarjeta">
          <button type="button" className="btn btn-secundario btn-sm" disabled>Ver detalle</button>
          <button type="button" className="btn btn-primario btn-sm" disabled>{agotado ? "Sin stock" : "Añadir"}</button>
        </div>
      </div>

      <h4>En la página del producto</h4>
      <div className="previa-detalle">
        <img
          src={imagenPrevia}
          alt=""
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/img/productos/sin-foto.png"; }}
        />
        <div>
          <span className="codigo">{categoriaNombre}</span>
          <h3>{nombrePrevia}</h3>
          <p>{descripcionPrevia}</p>
          <PrecioProducto info={info} grande />
          {info.oferta && (
            <p className="detalle-oferta">
              {info.oferta.nombre} · ahorras {info.ahorro.toLocaleString("es-CL")} CLP
            </p>
          )}
          {agotado && <p className="texto-error visible">Producto agotado</p>}
          {pocas && <p className="texto-error visible">¡Quedan pocas unidades!</p>}
          <span className="codigo">Código: {productoPrevia.codigo || "—"}</span>
        </div>
      </div>
      {info.oferta && (
        <p className="vista-previa-nota">Oferta aplicada automáticamente: {info.oferta.nombre}.</p>
      )}
    </aside>
    </div>
  );
}

export default AdminProductoForm;
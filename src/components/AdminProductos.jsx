import { useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIAS, formatoCLP } from "../data/productos";
import { useProductos } from "../context/ProductsContext";

function AdminProductos() {
  const { productos, eliminarProducto, cargandoProductos, errorProductos, recargarProductos } = useProductos();
  const [errorEliminar, setErrorEliminar] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [soloBajo, setSoloBajo] = useState(false);

  const esCritico = (p) => p.stockCritico != null && p.stock <= p.stockCritico;
  const texto = busqueda.trim().toLowerCase();
  const visibles = productos.filter(
    (p) =>
      (!texto || p.nombre.toLowerCase().includes(texto) || p.codigo.toLowerCase().includes(texto)) &&
      (!categoria || p.categoria === categoria) &&
      (!soloBajo || esCritico(p))
  );

  function exportarCSV() {
    const celda = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const filas = [
      ["codigo", "nombre", "categoria", "precio", "stock", "stockCritico"],
      ...visibles.map((p) => [p.codigo, p.nombre, p.categoria, p.precio, p.stock, p.stockCritico]),
    ];
    const csv = "\uFEFF" + filas.map((f) => f.map(celda).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "productos-ferreteria-carrasco.csv";
    enlace.click();
    URL.revokeObjectURL(url);
  }

  function nombreCategoria(id) {
    const cat = CATEGORIAS.find((c) => c.id === id);
    return cat ? cat.nombre : id;
  }

  async function eliminar(p) {
    // confirm pide confirmacion antes de borrar, por si fue un clic accidental
    if (window.confirm(`¿Eliminar "${p.nombre}" del catálogo?`)) {
      setErrorEliminar("");
      const resultado = await eliminarProducto(p.codigo);
      if (resultado && !resultado.ok) setErrorEliminar(resultado.mensaje);
    }
  }

  return (
    <div className="panel-admin">
      <div className="panel-admin-cabecera">
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Catálogo de productos</h2>
        <div className="grupo-botones">
          <button type="button" className="btn btn-secundario btn-sm" onClick={exportarCSV}>Exportar CSV</button>
          <Link to="/admin/productos/nuevo" className="btn btn-primario btn-sm">+ Nuevo producto</Link>
        </div>
      </div>

      <div className="barra-herramientas">
        <input
          type="search"
          placeholder="Buscar por nombre o código"
          aria-label="Buscar productos"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select aria-label="Filtrar por categoría" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <label className="casilla">
          <input type="checkbox" checked={soloBajo} onChange={(e) => setSoloBajo(e.target.checked)} />
          Solo stock bajo
        </label>
      </div>

      {cargandoProductos && <p role="status">Cargando productos del servicio...</p>}
      {errorProductos && (
        <div className="aviso error" role="alert">
          No se pudo cargar el catálogo: {errorProductos}{" "}
          <button type="button" className="btn btn-secundario btn-sm" onClick={recargarProductos}>
            Reintentar
          </button>
        </div>
      )}
      {errorEliminar && <div className="aviso error" role="alert">{errorEliminar}</div>}

      <table className="tabla-admin">
        <thead>
          <tr>
            <th>Código</th><th>Nombre</th><th>Categoría</th><th>Precio</th>
            <th>Stock</th><th>Estado</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.length === 0 && !cargandoProductos && !errorProductos && (
            <tr><td colSpan="7">Aún no hay productos. Crea el primero.</td></tr>
          )}
          {productos.length > 0 && visibles.length === 0 && (
            <tr><td colSpan="7">Ningún producto coincide con los filtros.</td></tr>
          )}
          {visibles.map((p) => {
            const critico = esCritico(p);
            return (
              <tr key={p.codigo}>
                <td>{p.codigo}</td>
                <td className="celda-producto">
                  {p.imagen && <img src={p.imagen} alt="" />}
                  <span>{p.nombre}</span>
                </td>
                <td>{nombreCategoria(p.categoria)}</td>
                <td>{formatoCLP(p.precio)}</td>
                <td>{p.stock}</td>
                <td>
                  {critico
                    ? <span className="pastilla critico">Stock crítico</span>
                    : <span className="pastilla ok">Normal</span>}
                </td>
                <td className="acciones-tabla">
                  <Link to={`/admin/productos/editar/${p.codigo}`}>Editar</Link>
                  <button type="button" className="eliminar" onClick={() => eliminar(p)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AdminProductos;
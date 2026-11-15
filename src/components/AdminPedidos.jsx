import { Fragment, useEffect, useState } from "react";
import { formatoCLP } from "../data/productos";
import { useProductos } from "../context/ProductsContext";
import { ESTADOS_PEDIDO, cambiarEstadoPedido, leerPedidos } from "../utils/pedidos";
import { cambiarEstadoPedidoApi, listarPedidosApi, pedidosApiHabilitada } from "../services/pedidosApi";

function claseEstado(estado) {
  return `pastilla estado-${estado.replace(/\s/g, "-").toLowerCase()}`;
}

function AdminPedidos() {
  const { productos, editarProducto } = useProductos();
  const [pedidos, setPedidos] = useState(() => (pedidosApiHabilitada ? [] : leerPedidos()));
  const [cargando, setCargando] = useState(pedidosApiHabilitada);
  const [filtro, setFiltro] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!pedidosApiHabilitada) return undefined;
    let montado = true;
    listarPedidosApi()
      .then((lista) => {
        if (montado) setPedidos(lista);
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

  const texto = busqueda.trim().toLowerCase();
  const visibles = pedidos.filter(
    (p) =>
      (filtro === "Todos" || p.estado === filtro) &&
      (!texto ||
        p.id.toLowerCase().includes(texto) ||
        p.cliente.nombre.toLowerCase().includes(texto) ||
        p.cliente.correo.toLowerCase().includes(texto))
  );

  function refrescar() {
    if (!pedidosApiHabilitada) return;
    listarPedidosApi().then(setPedidos).catch(() => {});
  }

  async function cambiar(pedido, estado) {
    if (estado === pedido.estado) return;

    if (pedidosApiHabilitada) {
      const cancelando = estado === "Cancelado";
      if (cancelando && !window.confirm(`¿Cancelar el pedido ${pedido.id}? Se devolverá el stock.`)) return;
      try {
        const actualizado = await cambiarEstadoPedidoApi(pedido.id, estado);
        // ms-pedidos devuelve el stock al cancelar; refrescamos por si cambió el inventario.
        setPedidos((actual) => actual.map((p) => (p.id === actualizado.id ? actualizado : p)));
        refrescar();
        setMensaje(`Pedido ${pedido.id} actualizado a "${estado}".`);
        setError("");
      } catch (e) {
        setError(e.message);
        setMensaje("");
      }
      return;
    }

    // Modo local: al cancelar se devuelve el stock; al reactivar se vuelve a descontar.
    const cancelando = estado === "Cancelado";
    if (cancelando && !window.confirm(`¿Cancelar el pedido ${pedido.id}? Se devolverá el stock.`)) return;
    if (cancelando || pedido.estado === "Cancelado") {
      const signo = cancelando ? 1 : -1;
      for (const l of pedido.lineas) {
        const producto = productos.find((p) => p.codigo === l.codigo);
        if (!producto || typeof producto.stock !== "number") continue;
        const resultado = await editarProducto(l.codigo, {
          ...producto,
          stock: Math.max(0, producto.stock + signo * l.cantidad),
        });
        if (resultado && !resultado.ok) {
          setError(`No se pudo actualizar el stock de ${l.nombre}: ${resultado.mensaje}`);
          setMensaje("");
          return;
        }
      }
    }
    setPedidos(cambiarEstadoPedido(pedido.id, estado));
    setMensaje(`Pedido ${pedido.id} actualizado a "${estado}".`);
    setError("");
  }

  return (
    <div className="panel-admin">
      <div className="panel-admin-cabecera">
        <h2>Pedidos</h2>
        <span className="contador">{visibles.length} de {pedidos.length}</span>
      </div>

      <div className="barra-herramientas">
        <input
          type="search"
          placeholder="Buscar por pedido, cliente o correo"
          aria-label="Buscar pedidos"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select aria-label="Filtrar por estado" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option>Todos</option>
          {ESTADOS_PEDIDO.map((e) => <option key={e}>{e}</option>)}
        </select>
      </div>

      {error && <div className="aviso error" role="alert">{error}</div>}
      {mensaje && !error && <div className="aviso exito" role="status">{mensaje}</div>}
      {cargando && <p>Cargando pedidos...</p>}

      <table className="tabla-admin">
        <thead>
          <tr><th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {visibles.length === 0 && (
            <tr><td colSpan="6">No hay pedidos que coincidan.</td></tr>
          )}
          {visibles.map((p) => (
            <Fragment key={p.id}>
              <tr>
                <td>{p.id}</td>
                <td>{new Date(p.fecha).toLocaleDateString("es-CL")}</td>
                <td>{p.cliente.nombre}<br /><small>{p.cliente.correo}</small></td>
                <td>{formatoCLP(p.total)}</td>
                <td><span className={claseEstado(p.estado)}>{p.estado}</span></td>
                <td className="acciones-tabla">
                  <select
                    aria-label={`Estado del pedido ${p.id}`}
                    value={p.estado}
                    onChange={(e) => cambiar(p, e.target.value)}
                  >
                    {ESTADOS_PEDIDO.map((e) => <option key={e}>{e}</option>)}
                  </select>
                  <button type="button" onClick={() => setAbierto(abierto === p.id ? null : p.id)}>
                    {abierto === p.id ? "Ocultar" : "Detalle"}
                  </button>
                </td>
              </tr>
              {abierto === p.id && (
                <tr className="fila-detalle">
                  <td colSpan="6">
                    <ul>
                      {p.lineas.map((l) => (
                        <li key={l.codigo}>
                          {l.cantidad} × {l.nombre} ({l.codigo}) — {formatoCLP(l.precio * l.cantidad)}
                        </li>
                      ))}
                    </ul>
                    <p>Subtotal {formatoCLP(p.subtotal)} · Envío {formatoCLP(p.envio)} · <strong>Total {formatoCLP(p.total)}</strong></p>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPedidos;

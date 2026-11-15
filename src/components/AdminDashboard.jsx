import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatoCLP } from "../data/productos";
import { useProductos } from "../context/ProductsContext";
import { leerPedidos, totalVentas } from "../utils/pedidos";
import { listarPedidosApi, pedidosApiHabilitada, resumenPedidosApi } from "../services/pedidosApi";
import { listarUsuariosApi, usuariosApiHabilitada } from "../services/usuariosApi";

function contarPendientesLocal(pedidos) {
  return pedidos.filter((p) => p.estado === "Pendiente").length;
}

function AdminDashboard() {
  const { productos } = useProductos();
  const [resumen, setResumen] = useState(null);
  const [recientes, setRecientes] = useState([]);
  const [totalUsuarios, setTotalUsuarios] = useState(null);

  useEffect(() => {
    let montado = true;
    if (pedidosApiHabilitada) {
      resumenPedidosApi().then((r) => montado && setResumen(r)).catch(() => {});
      listarPedidosApi()
        .then((lista) => {
          if (montado) setRecientes(lista.slice(0, 5));
        })
        .catch(() => {});
    }
    if (usuariosApiHabilitada) {
      listarUsuariosApi()
        .then((lista) => {
          if (montado) setTotalUsuarios(lista.length);
        })
        .catch(() => {});
    }
    return () => {
      montado = false;
    };
  }, []);

  // Modo local (sin ms-pedidos): mismos cálculos sobre el navegador.
  const pedidosLocales = pedidosApiHabilitada ? [] : leerPedidos();

  const criticos = productos.filter(
    (p) => p.stockCritico != null && p.stock <= p.stockCritico
  );

  const usuarios = totalUsuarios ?? JSON.parse(localStorage.getItem("usuarios_carrasco") || "[]").length;
  const ventasTotales = pedidosApiHabilitada
    ? (resumen?.ventasTotales ?? 0)
    : totalVentas(pedidosLocales);
  const totalPedidos = pedidosApiHabilitada
    ? (resumen?.totalPedidos ?? 0)
    : pedidosLocales.length;
  const pendientes = pedidosApiHabilitada
    ? (resumen?.pedidosPorEstado?.Pendiente ?? 0)
    : contarPendientesLocal(pedidosLocales);
  const ultimos = pedidosApiHabilitada ? recientes : pedidosLocales.slice(0, 5);

  // Más vendidos: API entrega el ranking; local se calcula desde los pedidos guardados.
  let top = [];
  if (pedidosApiHabilitada) {
    top = (resumen?.masVendidos ?? []).map((m) => ({ nombre: m.nombre, unidades: m.unidades }));
  } else {
    const vendidos = {};
    pedidosLocales
      .filter((p) => p.estado !== "Cancelado")
      .forEach((p) =>
        p.lineas.forEach((l) => {
          vendidos[l.nombre] = vendidos[l.nombre] ?? { unidades: 0 };
          vendidos[l.nombre].unidades += l.cantidad;
        })
      );
    top = Object.entries(vendidos)
      .map(([nombre, d]) => ({ nombre, unidades: d.unidades }))
      .sort((a, b) => b.unidades - a.unidades)
      .slice(0, 5);
  }
  const maximo = top[0]?.unidades ?? 1;

  return (
    <>
      <div className="tarjetas-metricas">
        <div className="tarjeta-metrica"><strong>{productos.length}</strong><span>Productos publicados</span></div>
        <div className="tarjeta-metrica"><strong>{usuarios}</strong><span>Usuarios registrados</span></div>
        <div className="tarjeta-metrica"><strong>{criticos.length}</strong><span>Productos con stock crítico</span></div>
        <div className="tarjeta-metrica"><strong>{formatoCLP(ventasTotales)}</strong><span>Ventas acumuladas</span></div>
        <div className="tarjeta-metrica"><strong>{totalPedidos}</strong><span>Pedidos totales</span></div>
        <div className="tarjeta-metrica"><strong>{pendientes}</strong><span>Pedidos pendientes</span></div>
      </div>

      <div className="admin-dos-columnas">
        <div className="panel-admin">
          <div className="panel-admin-cabecera">
            <h2>Últimos pedidos</h2>
            <Link to="/admin/pedidos" className="btn btn-secundario btn-sm">Ver todos</Link>
          </div>
          <table className="tabla-admin">
            <thead>
              <tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {ultimos.length === 0 ? (
                <tr><td colSpan="4">Aún no hay pedidos registrados.</td></tr>
              ) : (
                ultimos.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td><td>{p.cliente.nombre}</td><td>{formatoCLP(p.total)}</td>
                    <td><span className={`pastilla estado-${p.estado.replace(/\s/g, "-").toLowerCase()}`}>{p.estado}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="panel-admin">
          <div className="panel-admin-cabecera"><h2>Más vendidos</h2></div>
          <ul className="ranking">
            {top.length === 0 ? (
              <li className="vacio">Sin ventas todavía.</li>
            ) : (
              top.map((d) => (
                <li key={d.nombre}>
                  <span>{d.nombre}</span>
                  <span className="barra"><span style={{ width: `${(d.unidades / maximo) * 100}%` }} /></span>
                  <strong>{d.unidades}</strong>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="panel-admin">
        <div className="panel-admin-cabecera">
          <h2>Productos con stock crítico</h2>
          <Link to="/admin/productos" className="btn btn-secundario btn-sm">Ir a productos</Link>
        </div>
        <table className="tabla-admin">
          <thead>
            <tr><th>Código</th><th>Producto</th><th>Stock</th><th>Stock crítico</th></tr>
          </thead>
          <tbody>
            {criticos.length === 0 ? (
              <tr><td colSpan="4">Ningún producto bajo el umbral crítico.</td></tr>
            ) : (
              criticos.map((p) => (
                <tr key={p.codigo}>
                  <td>{p.codigo}</td><td>{p.nombre}</td><td>{p.stock}</td><td>{p.stockCritico}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default AdminDashboard;

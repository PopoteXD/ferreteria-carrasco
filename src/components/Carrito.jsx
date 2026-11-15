import { useState } from "react";
import { Link } from "react-router-dom";
import { formatoCLP } from "../data/productos";
import { useCart } from "../context/CartContext";
import { useProductos } from "../context/ProductsContext";
import { useAuth } from "../context/AuthContext";
import { useOfertas } from "../context/OfertasContext";
import { tieneControlDeStock } from "../utils/stock";
import { registrarPedido } from "../utils/pedidos";
import { pedidosApiHabilitada, crearPedidoApi } from "../services/pedidosApi";
import { pagosApiHabilitada, crearPagoApi, confirmarPagoApi } from "../services/pagosApi";

const METODOS_PAGO = ["Débito", "Crédito", "Transferencia"];

function Carrito() {
  const { carrito, cambiarCantidad, quitar, vaciar } = useCart();
  const { usuario } = useAuth();
  const { precioDe } = useOfertas();
  const [compraOk, setCompraOk] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [metodo, setMetodo] = useState("Débito");
  const [errorStock, setErrorStock] = useState(null);
  const [comprando, setComprando] = useState(false);
  const { productos, descontarStock, recargarProductos } = useProductos();

  const lineas = carrito
    .map((l) => ({ ...l, producto: productos.find((p) => p.codigo === l.codigo) }))
    .filter((l) => l.producto)
    // precio unitario con la oferta vigente (si la hay)
    .map((l) => ({ ...l, info: precioDe(l.producto) }));

  const subtotal = lineas.reduce((acc, l) => acc + l.info.precioFinal * l.cantidad, 0);
  const envio = subtotal > 0 ? 4990 : 0;

  // Lineas cuya cantidad supera el stock disponible (por ejemplo, datos
  // guardados antes de que existiera el control de stock).
  const excedidas = lineas.filter(
    (l) => tieneControlDeStock(l.producto) && l.cantidad > l.producto.stock
  );

  const requiereSesion = pedidosApiHabilitada && !usuario;

  async function finalizarCompra() {
    if (excedidas.length > 0) {
      setCompraOk(false);
      setErrorStock(
        "No hay stock suficiente para: " + excedidas.map((l) => l.producto.nombre).join(", ")
      );
      return;
    }

    setComprando(true);
    setCompraOk(false);
    setResultado(null);
    setErrorStock(null);
    try {
      if (pedidosApiHabilitada) {
        // ms-pedidos valida el stock, toma precio/nombre del catálogo,
        // descuenta el inventario en ms-productos y devuelve el pedido.
        const pedido = await crearPedidoApi({
          cliente: {
            nombre: `${usuario.nombre ?? ""} ${usuario.apellidos ?? ""}`.trim(),
            correo: usuario.correo,
          },
          lineas: lineas.map((l) => ({
            codigo: l.codigo,
            nombre: l.producto.nombre,
            precio: l.info.precioFinal,
            cantidad: l.cantidad,
          })),
        });

        let pago = null;
        let falloPago = null;
        if (pagosApiHabilitada) {
          try {
            pago = await crearPagoApi({ pedidoId: pedido.id, metodo, monto: pedido.total });
          } catch (e) {
            falloPago = e.message;
          }
        }

        if (recargarProductos) await recargarProductos();
        vaciar();
        setResultado({
          pedidoId: pedido.id,
          pagoEstado: pago?.estado ?? null,
          referencia: pago?.referencia ?? null,
          pagoId: pago?.id ?? null,
          falloPago,
        });
        setCompraOk(true);
      } else {
        // Modo local (sin ms-pedidos): la compra sigue siendo una simulación
        // y cada cambio de stock se guarda vía REST o en el navegador.
        for (const linea of lineas) {
          const resultadoLinea = await descontarStock(linea.codigo, linea.cantidad);
          if (resultadoLinea && !resultadoLinea.ok) throw new Error(resultadoLinea.mensaje);
        }
        registrarPedido({
          lineas: lineas.map((l) => ({
            codigo: l.codigo,
            nombre: l.producto.nombre,
            precio: l.info.precioFinal,
            cantidad: l.cantidad,
          })),
          subtotal,
          envio,
        });
        vaciar();
        setResultado(null);
        setCompraOk(true);
      }
    } catch (error) {
      if (recargarProductos) await recargarProductos();
      setErrorStock(
        pedidosApiHabilitada
          ? `No se pudo registrar la compra: ${error.message}. Revisa el stock antes de reintentar.`
          : `No se pudo actualizar el inventario: ${error.message}. Revisa el stock antes de reintentar.`
      );
    } finally {
      setComprando(false);
    }
  }

  async function confirmarTransferencia() {
    if (!resultado?.pagoId) return;
    try {
      const pago = await confirmarPagoApi(resultado.pagoId);
      setResultado({ ...resultado, pagoEstado: pago.estado });
    } catch (error) {
      setErrorStock(`No se pudo confirmar la transferencia: ${error.message}`);
    }
  }

  return (
    <section className="seccion">
      <div className="contenedor">
        <div className="titulo-seccion">
          <h2>Tu carrito de compras</h2>
        </div>

        {compraOk && (
          <div className="aviso exito">
            {pedidosApiHabilitada ? (
              <>
                Compra registrada con el pedido <strong>{resultado?.pedidoId}</strong>.
                {resultado?.falloPago
                  ? ` El pago no pudo registrarse: ${resultado.falloPago}`
                  : resultado?.pagoEstado === "Pendiente"
                    ? " Quedó pendiente la confirmación de tu transferencia."
                    : resultado?.pagoEstado
                      ? ` Pago ${resultado.pagoEstado} (${resultado.referencia}).`
                      : ""}
              </>
            ) : (
              "Compra registrada con exito (simulacion)"
            )}
          </div>
        )}

        {compraOk && resultado?.pagoEstado === "Pendiente" && (
          <button type="button" className="btn btn-secundario btn-sm" onClick={confirmarTransferencia}>
            Ya realicé la transferencia (confirmar pago)
          </button>
        )}

        {errorStock && <div className="aviso error">{errorStock}</div>}

        {requiereSesion && (
          <div className="aviso error">
            <Link to="/login">Inicia sesión</Link> para finalizar tu compra.
          </div>
        )}

        {lineas.length === 0 ? (
          <div className="carrito-vacio">
            <h3>Tu carrito esta vacio</h3>
            <p>Agrega productos desde el <Link to="/productos">catalogo</Link>.</p>
          </div>
        ) : (
          <>
            <table className="tabla-carrito">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((l) => (
                  <tr key={l.codigo}>
                    <td>
                      <div className="fila-producto-carrito">
                        <img src={l.producto.imagen} alt={l.producto.nombre} />
                        <div>
                          <div>{l.producto.nombre}</div>
                          <div className="codigo">Codigo: {l.codigo}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {formatoCLP(l.info.precioFinal)}
                      {l.info.oferta && (
                        <div className="codigo"><s>{formatoCLP(l.info.precioBase)}</s> · {l.info.oferta.nombre}</div>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(l.codigo, -1)}
                        disabled={l.cantidad <= 1}
                      >
                        -
                      </button>
                      <span style={{ margin: "0 10px" }}>{l.cantidad}</span>
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(l.codigo, 1)}
                        disabled={tieneControlDeStock(l.producto) && l.cantidad >= l.producto.stock}
                      >
                        +
                      </button>
                      {tieneControlDeStock(l.producto) && (
                        <div className="codigo">Stock disponible: {l.producto.stock}</div>
                      )}
                      {tieneControlDeStock(l.producto) && l.cantidad > l.producto.stock && (
                        <div className="codigo" style={{ color: "#b00020" }}>
                          Supera el stock disponible
                        </div>
                      )}
                    </td>
                    <td>{formatoCLP(l.info.precioFinal * l.cantidad)}</td>
                    <td>
                      <button type="button" className="btn-quitar" onClick={() => quitar(l.codigo)}>
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              type="button"
              className="btn btn-secundario btn-sm"
              style={{ marginTop: "15px" }}
              onClick={vaciar}
            >
              Vaciar carrito
            </button>

            <div className="resumen-carrito">
              <div className="linea"><span>Subtotal</span><span>{formatoCLP(subtotal)}</span></div>
              <div className="linea"><span>Envio</span><span>{formatoCLP(envio)}</span></div>
              <div className="linea total"><span>Total</span><span>{formatoCLP(subtotal + envio)}</span></div>

              {pedidosApiHabilitada && (
                <div className="linea">
                  <label htmlFor="metodo-pago" style={{ marginRight: "8px" }}>Método de pago</label>
                  <select
                    id="metodo-pago"
                    value={metodo}
                    onChange={(e) => setMetodo(e.target.value)}
                  >
                    {METODOS_PAGO.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
              )}
              {pedidosApiHabilitada && !pagosApiHabilitada && (
                <div className="codigo">ms-pagos no configurado: el pago no quedará registrado.</div>
              )}

              <button
                type="button"
                className="btn btn-primario"
                style={{ width: "100%", marginTop: "15px" }}
                onClick={finalizarCompra}
                disabled={comprando || requiereSesion}
              >
                {comprando
                  ? pedidosApiHabilitada ? "Procesando compra..." : "Actualizando inventario..."
                  : "Finalizar compra"}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default Carrito;

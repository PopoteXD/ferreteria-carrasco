import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CATEGORIAS } from "../data/productos";
import { useCart } from "../context/CartContext";
import { useProductos } from "../context/ProductsContext";
import { useOfertas } from "../context/OfertasContext";
import { descripcionDescuento, diasRestantes, etiquetaOferta } from "../utils/ofertas";
import PrecioProducto from "./PrecioProducto";
import { unidadesDisponibles } from "../utils/stock";
import { RESENAS_EJEMPLO, leerResenasGuardadas, resumenResenas } from "../data/resenas";
import Estrellas from "./Estrellas";
import ResenasProducto from "./ResenasProducto";
import ProductosRecomendados from "./ProductosRecomendados";

function ProductoDetalle() {
  const { codigo } = useParams(); // lee :codigo de la URL /producto/:codigo
  const { agregar, carrito } = useCart();
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);
  const { productos } = useProductos();
  const { precioDe } = useOfertas();
  const [guardadas, setGuardadas] = useState(() => leerResenasGuardadas()[codigo] ?? []);

  const producto = productos.find((p) => p.codigo === codigo);

  if (!producto) {
    return (
      <section className="seccion">
        <div className="contenedor">
          <p>No encontramos ese producto. <Link to="/productos">Volver al catálogo</Link></p>
        </div>
      </section>
    );
  }

  const info = precioDe(producto);
  const dias = info.oferta ? diasRestantes(info.oferta) : null;
  const categoria = CATEGORIAS.find((c) => c.id === producto.categoria);
  const enCarrito = carrito?.find((l) => l.codigo === producto.codigo)?.cantidad ?? 0;
  const disponibles = unidadesDisponibles(producto, enCarrito);
  const sinDisponibles = disponibles <= 0;
  // Tope para el input numerico (999 = sin control de stock).
  const tope = disponibles === Infinity ? 999 : Math.max(1, disponibles);

  const { total: totalResenas, promedio } = resumenResenas([...guardadas, ...RESENAS_EJEMPLO]);
  const stockBajo = typeof producto.stock === "number" && producto.stock > 0 &&
    producto.stock <= (producto.stockCritico ?? 5);

  function añadir() {
    if (sinDisponibles) return;
    const cantidadFinal = Math.min(cantidad, tope);
    agregar(producto.codigo, cantidadFinal);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1500);
  }

  return (
    <section className="seccion">
      <div className="contenedor">
        <p><Link to="/productos">← Volver al catálogo</Link></p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "40px", marginTop: "20px" }}>
          <div className="galeria">
            <img src={producto.imagen} alt={producto.nombre} />
          </div>

          <div>
            <span className="categoria">{categoria ? categoria.nombre : producto.categoria}</span>
            <h1>{producto.nombre}</h1>
            <a href="#titulo-resenas" className="valoracion-resumen">
              <Estrellas valor={promedio} />
              <span>{promedio.toFixed(1)} · {totalResenas} reseñas</span>
            </a>
            <p>{producto.descripcion}</p>
            <PrecioProducto info={info} grande />
            {info.oferta && (
              <p className="detalle-oferta">
                <span className="cinta-oferta en-linea" style={info.oferta.color ? { backgroundColor: info.oferta.color } : undefined}>
                  {etiquetaOferta(info.oferta, info)}
                </span>{" "}
                <strong>{info.oferta.nombre}</strong> · {descripcionDescuento(info.oferta)} · Ahorras{" "}
                {"$" + info.ahorro.toLocaleString("es-CL")}
                {dias !== null && (dias === 0 ? " · ¡Termina hoy!" : ` · Quedan ${dias} día${dias === 1 ? "" : "s"}`)}
              </p>
            )}
            <p>Código: {producto.codigo}</p>
            {producto.stock !== undefined && <p>Stock disponible: {producto.stock} unidades</p>}
            {stockBajo && <p className="aviso-stock-bajo">¡Quedan pocas unidades!</p>}

            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "20px" }}>
              <input
                type="number"
                min="1"
                max={tope}
                value={cantidad}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (Number.isNaN(n)) {
                    setCantidad(1);
                    return;
                  }
                  setCantidad(Math.min(Math.max(1, n), tope));
                }}
                style={{ width: "70px", padding: "10px" }}
              />
              <button
                type="button"
                className="btn btn-primario"
                onClick={añadir}
                disabled={sinDisponibles}
              >
                {sinDisponibles ? "Sin stock disponible" : "Agregar al carrito"}
              </button>
            </div>

            {agregado && <p style={{ color: "green" }}>Producto agregado al carrito</p>}

            <ul className="beneficios">
              <li><strong>Compra segura</strong><span>Tus datos protegidos</span></li>
              <li><strong>Atención personalizada</strong><span>Asesoría de nuestro equipo</span></li>
              <li><strong>Productos seleccionados</strong><span>Calidad para tu proyecto</span></li>
            </ul>
          </div>
        </div>

        <ResenasProducto codigo={producto.codigo} guardadas={guardadas} setGuardadas={setGuardadas} />
        <ProductosRecomendados productos={productos} actual={producto} />
      </div>
    </section>
  );
}

export default ProductoDetalle;
import { useCart } from "../context/CartContext";
import { useOfertas } from "../context/OfertasContext";
import { etiquetaOferta } from "../utils/ofertas";
import PrecioProducto from "./PrecioProducto";
import { unidadesDisponibles } from "../utils/stock";
import { Link } from "react-router-dom";

function ProductCard({ producto }) {
  const { agregar, carrito } = useCart();
  const { precioDe } = useOfertas();
  const info = precioDe(producto);

  const enCarrito = carrito?.find((l) => l.codigo === producto.codigo)?.cantidad ?? 0;
  const disponibles = unidadesDisponibles(producto, enCarrito);
  const agotado = typeof producto.stock === "number" && producto.stock <= 0;
  const sinDisponibles = disponibles <= 0;

  const textoBoton = agotado ? "Sin stock" : sinDisponibles ? "Max. en carrito" : "Añadir";

  return (
    <div className="tarjeta-producto">
      <div className="miniatura">
        <img src={producto.imagen} alt={producto.nombre} />
        {info.oferta && (
          <span className="cinta-oferta" style={info.oferta.color ? { backgroundColor: info.oferta.color } : undefined}>
            {etiquetaOferta(info.oferta, info)}
          </span>
        )}
      </div>
      <div className="cuerpo">
        <h3>{producto.nombre}</h3>
        <span className="codigo">Codigo: {producto.codigo}</span>
        <PrecioProducto info={info} />
        {typeof producto.stock === "number" && (
          <span className="codigo">Stock disponible: {producto.stock}</span>
        )}
      </div>
      <div className="acciones-tarjeta">
        <Link to={`/producto/${producto.codigo}`} className="btn btn-secundario btn-sm">
          Ver detalle
        </Link>
            <button
              type="button"
              className="btn btn-primario btn-sm"
              disabled={sinDisponibles}
              onClick={() => agregar(producto.codigo)}
            >
              {textoBoton}
          </button>
      </div>
    </div>
  );
}

export default ProductCard;
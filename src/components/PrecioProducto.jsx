import { formatoCLP } from "../data/productos";

/**
 * Precio de un producto. Sin oferta mantiene el estilo normal; con oferta muestra
 * el precio final y el anterior tachado. `info` viene de precioDe(producto).
 */
function PrecioProducto({ info, grande = false }) {
  const Etiqueta = grande ? "div" : "span";
  const base = grande ? "precio-grande" : "precio";

  if (!info.oferta) {
    return <Etiqueta className={base}>{formatoCLP(info.precioBase)}</Etiqueta>;
  }

  return (
    <Etiqueta className={`${base} precio-con-oferta`}>
      <span className="precio-actual">{formatoCLP(info.precioFinal)}</span>
      <s className="precio-anterior" aria-label="Precio anterior">{formatoCLP(info.precioBase)}</s>
    </Etiqueta>
  );
}

export default PrecioProducto;

import { useState } from "react";
import { Link } from "react-router-dom";
import { useProductos } from "../context/ProductsContext";
import { useOfertas } from "../context/OfertasContext";
import {
  aplicaA,
  descripcionDescuento,
  diasRestantes,
  formatoFecha,
} from "../utils/ofertas";
import ProductCard from "./ProductCard";

function textoPlazo(oferta) {
  const dias = diasRestantes(oferta);
  if (dias === null) return "Hasta agotar stock";
  if (dias === 0) return "¡Termina hoy!";
  if (dias === 1) return "Termina mañana";
  if (dias <= 7) return `Quedan ${dias} días`;
  return `Hasta el ${formatoFecha(oferta.fin)}`;
}

function Ofertas() {
  const { productos } = useProductos();
  const { vigentes, precioDe, cargandoOfertas } = useOfertas();
  const [seleccion, setSeleccion] = useState(null);

  const campana = vigentes.find((o) => o.id === seleccion) ?? null;
  const lista = productos.filter((p) => {
    if (!precioDe(p).oferta) return false;
    return campana ? aplicaA(campana, p) : true;
  });

  return (
    <section className="seccion">
      <div className="contenedor">
        <div className="titulo-seccion">
          <h2>Ofertas</h2>
        </div>

        {cargandoOfertas && <p role="status">Cargando ofertas...</p>}

        {!cargandoOfertas && vigentes.length === 0 && (
          <div className="carrito-vacio">
            <h3>Por ahora no hay ofertas vigentes</h3>
            <p>Vuelve pronto o revisa el <Link to="/productos">catálogo completo</Link>.</p>
          </div>
        )}

        {vigentes.length > 0 && (
          <>
            <div className="banners-ofertas">
              {vigentes.map((o) => (
                <button
                  type="button"
                  key={o.id}
                  className={`banner-oferta ${seleccion === o.id ? "activo" : ""}`}
                  style={{ backgroundColor: o.color || "#d92d20" }}
                  aria-pressed={seleccion === o.id}
                  onClick={() => setSeleccion(seleccion === o.id ? null : o.id)}
                >
                  <span className="banner-oferta-valor">{o.etiqueta?.trim() || descripcionDescuento(o)}</span>
                  <strong>{o.nombre}</strong>
                  {o.descripcion && <span className="banner-oferta-texto">{o.descripcion}</span>}
                  <span className="banner-oferta-plazo">{textoPlazo(o)}</span>
                </button>
              ))}
            </div>

            <p>
              {lista.length} producto(s) en oferta
              {campana && (
                <>
                  {" "}en «{campana.nombre}» ·{" "}
                  <button type="button" className="enlace-boton" onClick={() => setSeleccion(null)}>
                    Ver todas
                  </button>
                </>
              )}
            </p>

            <div className="grid-productos">
              {lista.map((producto) => (
                <ProductCard key={producto.codigo} producto={producto} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default Ofertas;

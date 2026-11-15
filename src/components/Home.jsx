import { Link } from "react-router-dom";
import { CATEGORIAS } from "../data/productos";
import { useProductos } from "../context/ProductsContext";
import { useOfertas } from "../context/OfertasContext";
import ProductCard from "./ProductCard";
import videoBienvenida from "../assets/video/bienvenida.mp4";

function Home() {
  const { productos } = useProductos();
  const { vigentes, precioDe } = useOfertas();
  const destacados = productos.slice(0, 8);
  // Portada: productos de campañas marcadas como destacadas (o, si no hay, de cualquier oferta vigente).
  const idsDestacadas = vigentes.filter((o) => o.destacada).map((o) => o.id);
  const enOferta = productos.filter((p) => {
    const { oferta } = precioDe(p);
    return oferta && (idsDestacadas.length === 0 || idsDestacadas.includes(oferta.id));
  });
  const ofertasPortada = enOferta.slice(0, 4);

  return (
    <>
      <section className="hero">
        <video autoPlay muted loop playsInline>
          <source src={videoBienvenida} type="video/mp4" />
        </video>
        <div className="hero-overlay">
          <div className="contenedor">
            <h1>Todo lo que tu proyecto necesita</h1>
            <p>Herramientas, materiales de construccion, pinturas, plomeria y electricidad.</p>
            <div className="hero-acciones">
              <a href="/productos" className="btn btn-primario">Ver catalogo</a>
              <a href="/nosotros" className="btn btn-secundario">Conocenos</a>
            </div>
          </div>
        </div>
      </section>

      <section className="seccion">
        <div className="contenedor">
          <div className="titulo-seccion">
            <h2>Compra por categoria</h2>
          </div>
          <div className="grid-categorias">
            {CATEGORIAS.map((cat) => (
              <Link key={cat.id} className="tarjeta-categoria" to={`/productos?categoria=${cat.id}`}>
                {cat.nombre}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {ofertasPortada.length > 0 && (
        <section className="seccion" aria-labelledby="titulo-ofertas-home">
          <div className="contenedor">
            <div className="titulo-seccion">
              <h2 id="titulo-ofertas-home">Ofertas imperdibles</h2>
            </div>
            <div className="grid-productos">
              {ofertasPortada.map((producto) => (
                <ProductCard key={producto.codigo} producto={producto} />
              ))}
            </div>
            <p style={{ textAlign: "center", marginTop: "20px" }}>
              <Link to="/ofertas" className="btn btn-primario">Ver todas las ofertas</Link>
            </p>
          </div>
        </section>
      )}

      <section className="seccion">
        <div className="contenedor">
          <div className="titulo-seccion">
            <h2>Destacados</h2>
          </div>
          <div className="grid-productos">
            {destacados.map((producto) => (
              <ProductCard key={producto.codigo} producto={producto} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
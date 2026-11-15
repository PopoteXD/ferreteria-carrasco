import ProductCard from "./ProductCard";

function ProductosRecomendados({ productos, actual }) {
  const otros = productos.filter((p) => p.codigo !== actual.codigo);
  // primero los de la misma categoría, luego el resto
  const ordenados = [
    ...otros.filter((p) => p.categoria === actual.categoria),
    ...otros.filter((p) => p.categoria !== actual.categoria),
  ].slice(0, 4);

  if (ordenados.length === 0) return null;

  return (
    <section className="recomendados" aria-labelledby="titulo-recomendados">
      <div className="titulo-seccion">
        <h2 id="titulo-recomendados">Recomendados por Ferretería Carrasco</h2>
      </div>
      <div className="grid-productos">
        {ordenados.map((p) => (
          <ProductCard key={p.codigo} producto={p} />
        ))}
      </div>
    </section>
  );
}

export default ProductosRecomendados;

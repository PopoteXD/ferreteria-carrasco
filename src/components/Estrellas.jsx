function Estrellas({ valor = 0, etiqueta }) {
  const redondeado = Math.round(valor * 2) / 2;
  const texto = etiqueta ?? `${valor.toFixed(1)} de 5 estrellas`;

  return (
    <span className="estrellas" role="img" aria-label={texto}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          aria-hidden="true"
          className={
            redondeado >= n ? "estrella llena" : redondeado >= n - 0.5 ? "estrella media" : "estrella"
          }
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default Estrellas;

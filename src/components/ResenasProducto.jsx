import { useState } from "react";
import Estrellas from "./Estrellas";
import {
  CLAVE_RESENAS,
  RESENAS_EJEMPLO,
  leerResenasGuardadas,
  resumenResenas,
} from "../data/resenas";

function ResenasProducto({ codigo, guardadas, setGuardadas }) {
  const [autor, setAutor] = useState("");
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");
  const [enviada, setEnviada] = useState(false);

  const resenas = [...guardadas, ...RESENAS_EJEMPLO];
  const { total, promedio, distribucion } = resumenResenas(resenas);

  function enviar(ev) {
    ev.preventDefault();
    if (autor.trim().length < 2) return setError("Escribe tu nombre (mínimo 2 caracteres).");
    if (calificacion < 1) return setError("Selecciona una calificación de 1 a 5 estrellas.");
    if (comentario.trim().length < 10) return setError("El comentario debe tener al menos 10 caracteres.");

    const nueva = {
      id: `r-${Date.now()}`,
      autor: autor.trim(),
      calificacion,
      comentario: comentario.trim(),
      fecha: new Date().toISOString().slice(0, 10),
    };
    const todas = leerResenasGuardadas();
    const lista = [nueva, ...(todas[codigo] ?? [])];
    try {
      localStorage.setItem(CLAVE_RESENAS, JSON.stringify({ ...todas, [codigo]: lista }));
    } catch {
      return setError("No se pudo guardar la reseña en este navegador.");
    }
    setGuardadas(lista);
    setAutor("");
    setCalificacion(0);
    setComentario("");
    setError("");
    setEnviada(true);
  }

  return (
    <section className="resenas" aria-labelledby="titulo-resenas">
      <h2 id="titulo-resenas">Opiniones de clientes</h2>

      <div className="resenas-grid">
        <div className="resenas-resumen">
          <div className="resenas-promedio">{promedio.toFixed(1)}</div>
          <Estrellas valor={promedio} />
          <p className="resenas-total">{total} {total === 1 ? "reseña" : "reseñas"}</p>
          <ul className="resenas-barras">
            {distribucion.map(({ estrellas, cantidad }) => (
              <li key={estrellas}>
                <span>{estrellas} ★</span>
                <span className="barra"><span style={{ width: `${total ? (cantidad / total) * 100 : 0}%` }} /></span>
                <span>{cantidad}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <ul className="resenas-lista">
            {resenas.map((r) => (
              <li key={r.id} className="resena">
                <div className="resena-cabecera">
                  <strong>{r.autor}</strong>
                  <Estrellas valor={r.calificacion} />
                  <span className="resena-fecha">{r.fecha}</span>
                </div>
                <p>{r.comentario}</p>
                {r.demo && <span className="resena-demo">Reseña de demostración</span>}
              </li>
            ))}
          </ul>

          <form className="resena-form" onSubmit={enviar} noValidate>
            <h3>Escribe tu opinión</h3>
            {error && <div className="aviso error" role="alert">{error}</div>}
            {enviada && <div className="aviso exito" role="status">¡Gracias por tu opinión!</div>}
            <div className="campo-formulario">
              <label htmlFor="resena-autor">Nombre</label>
              <input id="resena-autor" value={autor} onChange={(e) => setAutor(e.target.value)} maxLength={40} />
            </div>
            <div className="campo-formulario">
              <span className="etiqueta-calificacion">Calificación</span>
              <div className="selector-estrellas" role="radiogroup" aria-label="Calificación">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={calificacion === n}
                    aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
                    className={n <= calificacion ? "activa" : ""}
                    onClick={() => setCalificacion(n)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="campo-formulario">
              <label htmlFor="resena-comentario">Comentario</label>
              <textarea id="resena-comentario" rows="3" value={comentario} onChange={(e) => setComentario(e.target.value)} maxLength={500} />
            </div>
            <button type="submit" className="btn btn-primario">Publicar reseña</button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default ResenasProducto;

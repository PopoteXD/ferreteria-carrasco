import { useState } from "react";
import { CLAVE_RESENAS, leerResenasGuardadas } from "../data/resenas";
import { useProductos } from "../context/ProductsContext";
import Estrellas from "./Estrellas";

function AdminResenas() {
  const { productos } = useProductos();
  const [porProducto, setPorProducto] = useState(leerResenasGuardadas);

  const filas = Object.entries(porProducto).flatMap(([codigo, lista]) =>
    lista.map((r) => ({ ...r, codigo }))
  );

  function eliminar(fila) {
    if (!window.confirm(`¿Eliminar la reseña de ${fila.autor}?`)) return;
    const nuevo = {
      ...porProducto,
      [fila.codigo]: porProducto[fila.codigo].filter((r) => r.id !== fila.id),
    };
    localStorage.setItem(CLAVE_RESENAS, JSON.stringify(nuevo));
    setPorProducto(nuevo);
  }

  return (
    <div className="panel-admin">
      <div className="panel-admin-cabecera">
        <h2>Moderación de reseñas</h2>
        <span className="contador">{filas.length} reseñas</span>
      </div>
      <table className="tabla-admin">
        <thead>
          <tr><th>Producto</th><th>Autor</th><th>Calificación</th><th>Comentario</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {filas.length === 0 && <tr><td colSpan="5">Aún no hay reseñas publicadas por clientes.</td></tr>}
          {filas.map((f) => (
            <tr key={f.id}>
              <td>{productos.find((p) => p.codigo === f.codigo)?.nombre ?? f.codigo}</td>
              <td>{f.autor}</td>
              <td><Estrellas valor={f.calificacion} /></td>
              <td>{f.comentario}</td>
              <td className="acciones-tabla">
                <button type="button" className="eliminar" onClick={() => eliminar(f)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminResenas;

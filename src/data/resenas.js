// Reseñas DE DEMOSTRACIÓN para maquetar la ficha de producto.
// Reemplázalas por opiniones reales de clientes (o deja la lista vacía) antes de publicar la tienda.
export const RESENAS_EJEMPLO = [
  { id: "demo-1", autor: "Cliente de ejemplo", calificacion: 5, fecha: "2026-09-12", comentario: "Muy buena calidad, cumple lo que promete y llegó bien embalado.", demo: true },
  { id: "demo-2", autor: "Cliente de ejemplo", calificacion: 4, fecha: "2026-08-03", comentario: "Buen producto por el precio. Lo recomiendo para uso en el hogar.", demo: true },
  { id: "demo-3", autor: "Cliente de ejemplo", calificacion: 5, fecha: "2026-07-21", comentario: "Excelente atención y el producto es tal cual la descripción.", demo: true },
];

export const CLAVE_RESENAS = "resenas_carrasco";

export function leerResenasGuardadas() {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE_RESENAS) || "{}");
    return lista && typeof lista === "object" && !Array.isArray(lista) ? lista : {};
  } catch {
    return {};
  }
}

export function resumenResenas(resenas) {
  const total = resenas.length;
  const promedio = total ? resenas.reduce((suma, r) => suma + r.calificacion, 0) / total : 0;
  const distribucion = [5, 4, 3, 2, 1].map((estrellas) => ({
    estrellas,
    cantidad: resenas.filter((r) => r.calificacion === estrellas).length,
  }));
  return { total, promedio, distribucion };
}

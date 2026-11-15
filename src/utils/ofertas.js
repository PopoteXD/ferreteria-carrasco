// Reglas de ofertas. Deben coincidir con Oferta.java (ms-productos), que es quien
// calcula el precio que realmente se cobra en un pedido.

export const TIPOS_DESCUENTO = [
  { id: "PORCENTAJE", nombre: "Porcentaje", ayuda: "Ej: 20 = 20% de descuento", unidad: "%" },
  { id: "MONTO", nombre: "Monto de descuento", ayuda: "Resta un valor fijo al precio", unidad: "$" },
  { id: "PRECIO_FIJO", nombre: "Precio especial", ayuda: "Todos quedan al mismo precio", unidad: "$" },
];

export const ALCANCES = [
  { id: "TODOS", nombre: "Todo el catálogo" },
  { id: "CATEGORIA", nombre: "Categorías" },
  { id: "PRODUCTOS", nombre: "Productos puntuales" },
];

export const COLORES_OFERTA = ["#d92d20", "#f5a623", "#1f8a4c", "#3a52a0", "#7a3fb5", "#131c42"];

const clp = (n) => "$" + Number(n).toLocaleString("es-CL");

/** Fecha local en formato YYYY-MM-DD (se compara como texto). */
export function hoyISO(fecha = new Date()) {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function sumarDias(iso, dias) {
  const [a, m, d] = iso.split("-").map(Number);
  return hoyISO(new Date(a, m - 1, d + dias));
}

export function formatoFecha(iso) {
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

export function estadoOferta(oferta, hoy = hoyISO()) {
  if (!oferta.activa) return "Inactiva";
  if (oferta.inicio && hoy < oferta.inicio) return "Programada";
  if (oferta.fin && hoy > oferta.fin) return "Vencida";
  return "Vigente";
}

export function ofertaVigente(oferta, hoy) {
  return estadoOferta(oferta, hoy) === "Vigente";
}

export function aplicaA(oferta, producto) {
  if (oferta.alcance === "TODOS") return true;
  if (oferta.alcance === "CATEGORIA") return (oferta.categorias ?? []).includes(producto.categoria);
  if (oferta.alcance === "PRODUCTOS") return (oferta.productos ?? []).includes(producto.codigo);
  return false;
}

/** Precio final entero de un precio base (nunca negativo ni mayor al base). */
export function aplicarOferta(oferta, precio) {
  const valor = Number(oferta.valor) || 0;
  let final = precio;
  if (oferta.tipo === "PORCENTAJE") final = precio - Math.floor((precio * valor + 50) / 100);
  else if (oferta.tipo === "MONTO") final = precio - valor;
  else if (oferta.tipo === "PRECIO_FIJO") final = valor;
  return Math.max(0, Math.min(final, precio));
}

/** Mejor oferta vigente para un producto (gana la más barata; no se acumulan). */
export function precioConOferta(producto, ofertas = [], hoy = hoyISO()) {
  const precioBase = Number(producto.precio) || 0;
  let mejor = null;
  let precioFinal = precioBase;
  for (const oferta of ofertas) {
    if (!ofertaVigente(oferta, hoy) || !aplicaA(oferta, producto)) continue;
    const candidato = aplicarOferta(oferta, precioBase);
    if (candidato < precioFinal) {
      precioFinal = candidato;
      mejor = oferta;
    }
  }
  const ahorro = precioBase - precioFinal;
  return {
    precioBase,
    precioFinal,
    oferta: mejor,
    ahorro,
    porcentaje: precioBase > 0 ? Math.round((ahorro / precioBase) * 100) : 0,
  };
}

/** Texto de la cinta: la etiqueta personalizada o el porcentaje real. */
export function etiquetaOferta(oferta, info) {
  const propia = (oferta.etiqueta ?? "").trim();
  if (propia) return propia;
  return info && info.porcentaje > 0 ? `-${info.porcentaje}%` : "OFERTA";
}

export function descripcionDescuento(oferta) {
  if (oferta.tipo === "PORCENTAJE") return `${oferta.valor}% de descuento`;
  if (oferta.tipo === "MONTO") return `${clp(oferta.valor)} de descuento`;
  return `Precio especial ${clp(oferta.valor)}`;
}

export function descripcionAlcance(oferta) {
  if (oferta.alcance === "TODOS") return "Todo el catálogo";
  if (oferta.alcance === "CATEGORIA") {
    const n = (oferta.categorias ?? []).length;
    return n === 1 ? "1 categoría" : `${n} categorías`;
  }
  const n = (oferta.productos ?? []).length;
  return n === 1 ? "1 producto" : `${n} productos`;
}

export function descripcionVigencia(oferta) {
  if (oferta.inicio && oferta.fin) return `${formatoFecha(oferta.inicio)} al ${formatoFecha(oferta.fin)}`;
  if (oferta.inicio) return `Desde ${formatoFecha(oferta.inicio)}`;
  if (oferta.fin) return `Hasta ${formatoFecha(oferta.fin)}`;
  return "Sin fecha de término";
}

/** Días que quedan (0 = termina hoy). null si no tiene fecha de término. */
export function diasRestantes(oferta, hoy = hoyISO()) {
  if (!oferta.fin) return null;
  const [a, m, d] = oferta.fin.split("-").map(Number);
  const [ha, hm, hd] = hoy.split("-").map(Number);
  return Math.round((Date.UTC(a, m - 1, d) - Date.UTC(ha, hm - 1, hd)) / 86400000);
}

export function productosAfectados(oferta, productos) {
  return productos.filter((p) => aplicaA(oferta, p));
}

/**
 * Pedidos de la tienda (almacenados en el navegador, igual que usuarios y carrito).
 * Cuando exista el microservicio de pedidos, solo hay que reemplazar estas funciones.
 */

export const CLAVE_PEDIDOS = "pedidos_carrasco";
export const ESTADOS_PEDIDO = ["Pendiente", "En preparación", "Enviado", "Entregado", "Cancelado"];

export function leerPedidos() {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE_PEDIDOS) || "[]");
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function guardarPedidos(lista) {
  localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(lista));
}

function clienteActual() {
  try {
    const sesion = JSON.parse(localStorage.getItem("sesion_carrasco") || "null");
    if (!sesion) return { nombre: "Invitado", correo: "" };
    return { nombre: `${sesion.nombre ?? ""} ${sesion.apellidos ?? ""}`.trim(), correo: sesion.correo ?? "" };
  } catch {
    return { nombre: "Invitado", correo: "" };
  }
}

/** lineas: [{ codigo, nombre, precio, cantidad }] */
export function registrarPedido({ lineas, subtotal, envio }) {
  const pedidos = leerPedidos();
  const siguiente = pedidos.reduce((max, p) => Math.max(max, Number(p.id.replace(/\D/g, "")) || 0), 1000) + 1;
  const pedido = {
    id: `PED-${siguiente}`,
    fecha: new Date().toISOString(),
    cliente: clienteActual(),
    lineas: lineas.map(({ codigo, nombre, precio, cantidad }) => ({ codigo, nombre, precio, cantidad })),
    subtotal,
    envio,
    total: subtotal + envio,
    estado: "Pendiente",
  };
  guardarPedidos([pedido, ...pedidos]);
  return pedido;
}

export function cambiarEstadoPedido(id, estado) {
  if (!ESTADOS_PEDIDO.includes(estado)) return leerPedidos();
  const lista = leerPedidos().map((p) => (p.id === id ? { ...p, estado } : p));
  guardarPedidos(lista);
  return lista;
}

/** Ventas = pedidos no cancelados. */
export function totalVentas(pedidos) {
  return pedidos.filter((p) => p.estado !== "Cancelado").reduce((suma, p) => suma + p.total, 0);
}

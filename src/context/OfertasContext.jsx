import { createContext, useContext } from "react";
import { precioConOferta } from "../utils/ofertas";

// Valor por defecto: sin ofertas. Así los componentes funcionan aunque no haya proveedor.
const SIN_OFERTAS = {
  ofertas: [],
  vigentes: [],
  cargandoOfertas: false,
  errorOfertas: "",
  precioDe: (producto) => precioConOferta(producto, []),
  recargarOfertas: async () => {},
  agregarOferta: async () => ({ ok: false, mensaje: "Ofertas no disponibles" }),
  editarOferta: async () => ({ ok: false, mensaje: "Ofertas no disponibles" }),
  eliminarOferta: async () => ({ ok: false, mensaje: "Ofertas no disponibles" }),
  alternarActiva: async () => ({ ok: false, mensaje: "Ofertas no disponibles" }),
};

export const OfertasContext = createContext(SIN_OFERTAS);

export function useOfertas() {
  return useContext(OfertasContext);
}

import { aplicarOferta, precioConOferta, estadoOferta } from "../src/utils/ofertas";

const base = { activa: true, alcance: "TODOS", inicio: "2026-01-01", fin: "2026-12-31", categorias: [], productos: [] };
const prod = { codigo: "HM001", categoria: "herramientas", precio: 10000 };

describe("ofertas", () => {
  it("calcula porcentaje, monto y precio fijo sin pasar de los límites", () => {
    expect(aplicarOferta({ tipo: "PORCENTAJE", valor: 25 }, 10000)).toBe(7500);
    expect(aplicarOferta({ tipo: "MONTO", valor: 99999 }, 10000)).toBe(0);
    expect(aplicarOferta({ tipo: "PRECIO_FIJO", valor: 20000 }, 10000)).toBe(10000);
  });

  it("elige la mejor oferta vigente y no las acumula", () => {
    const ofertas = [
      { ...base, id: 1, tipo: "PORCENTAJE", valor: 10 },
      { ...base, id: 2, tipo: "PORCENTAJE", valor: 30 },
    ];
    const info = precioConOferta(prod, ofertas, "2026-06-01");
    expect(info.precioFinal).toBe(7000);
    expect(info.oferta.id).toBe(2);
    expect(info.ahorro).toBe(3000);
  });

  it("ignora ofertas vencidas, pausadas o de otros productos", () => {
    const ofertas = [
      { ...base, id: 1, tipo: "PORCENTAJE", valor: 50, fin: "2026-02-01" },
      { ...base, id: 2, tipo: "PORCENTAJE", valor: 50, activa: false },
      { ...base, id: 3, tipo: "PORCENTAJE", valor: 50, alcance: "PRODUCTOS", productos: ["XX1"] },
    ];
    const info = precioConOferta(prod, ofertas, "2026-06-01");
    expect(info.oferta).toBeNull();
    expect(info.precioFinal).toBe(10000);
  });

  it("informa el estado de la oferta", () => {
    expect(estadoOferta({ ...base, activa: false }, "2026-06-01")).toMatch(/inactiva/i);
    expect(estadoOferta(base, "2026-06-01")).toMatch(/vigente/i);
    expect(estadoOferta(base, "2027-01-01")).toMatch(/vencida/i);
  });
});

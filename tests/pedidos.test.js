import { beforeEach, describe, expect, it } from "vitest";
import {
  cambiarEstadoPedido,
  leerPedidos,
  registrarPedido,
  totalVentas,
} from "../src/utils/pedidos";

const LINEAS = [{ codigo: "HM001", nombre: "Martillo", precio: 1000, cantidad: 2 }];

describe("pedidos", () => {
  beforeEach(() => localStorage.clear());

  it("registra un pedido pendiente con total e id correlativo", () => {
    const a = registrarPedido({ lineas: LINEAS, subtotal: 2000, envio: 500 });
    const b = registrarPedido({ lineas: LINEAS, subtotal: 2000, envio: 500 });

    expect(a).toMatchObject({ id: "PED-1001", estado: "Pendiente", total: 2500 });
    expect(b.id).toBe("PED-1002");
    expect(leerPedidos()).toHaveLength(2);
  });

  it("cambia el estado y excluye cancelados de las ventas", () => {
    const a = registrarPedido({ lineas: LINEAS, subtotal: 2000, envio: 500 });
    registrarPedido({ lineas: LINEAS, subtotal: 1000, envio: 500 });

    const lista = cambiarEstadoPedido(a.id, "Cancelado");

    expect(lista.find((p) => p.id === a.id).estado).toBe("Cancelado");
    expect(totalVentas(lista)).toBe(1500);
  });

  it("ignora estados inválidos", () => {
    const a = registrarPedido({ lineas: LINEAS, subtotal: 2000, envio: 500 });
    cambiarEstadoPedido(a.id, "Inventado");
    expect(leerPedidos()[0].estado).toBe("Pendiente");
  });
});

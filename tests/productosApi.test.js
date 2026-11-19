import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("cliente REST de productos", () => {
  it("consulta el catálogo con la base URL configurada", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8081/");
    const respuesta = [{ codigo: "HM001", nombre: "Martillo" }];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => respuesta,
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.resetModules();
    const api = await import("../src/services/productosApi");

    await expect(api.listarProductos()).resolves.toEqual(respuesta);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8081/api/v1/productos",
      expect.objectContaining({ headers: {} })
    );
    expect(api.productosApiHabilitada).toBe(true);
  });

  it("codifica el código de producto y gestiona respuestas sin contenido", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8081");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);
    vi.resetModules();
    const api = await import("../src/services/productosApi");

    await expect(api.borrarProducto("A/B 1")).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8081/api/v1/productos/A%2FB%201",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("expone el mensaje enviado por la API en respuestas de error", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8081");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ mensaje: "Ya existe un producto con ese código" }),
    }));
    vi.resetModules();
    const api = await import("../src/services/productosApi");

    await expect(api.crearProducto({ codigo: "HM001" })).rejects.toMatchObject({
      message: "Ya existe un producto con ese código",
      status: 409,
    });
  });
});

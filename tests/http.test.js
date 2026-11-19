import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchConTiempo } from "../src/services/http";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("fetchConTiempo", () => {
  it("devuelve la respuesta cuando fetch termina a tiempo", async () => {
    const respuesta = { ok: true, status: 200 };
    const fetchMock = vi.fn().mockResolvedValue(respuesta);
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchConTiempo("http://ejemplo/api")).resolves.toBe(respuesta);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://ejemplo/api",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("aborta la petición cuando supera el tiempo máximo", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      (_url, opciones) =>
        new Promise((_resolver, rechazar) => {
          opciones.signal.addEventListener("abort", () =>
            rechazar(new Error("abortado")),
          );
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const peticion = fetchConTiempo("http://ejemplo/lento", {}, 1000);
    const comprobacion = expect(peticion).rejects.toThrow("abortado");
    await vi.advanceTimersByTimeAsync(1000);
    await comprobacion;
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  });
});

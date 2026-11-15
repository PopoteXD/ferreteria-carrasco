import {
  guardarToken,
  leerToken,
  borrarToken,
  cabeceraAuth,
  avisarSiExpirada,
  EVENTO_SESION_EXPIRADA,
} from "../src/services/sesion";

describe("sesion (token JWT)", () => {
  beforeEach(() => localStorage.clear());

  it("guarda y lee el token con su expiracion", () => {
    guardarToken("abc", 60);
    const t = leerToken();
    expect(t.token).toBe("abc");
    expect(t.expira).toBeGreaterThan(Date.now());
  });

  it("devuelve la cabecera Authorization Bearer", () => {
    guardarToken("abc", 60);
    expect(cabeceraAuth()).toEqual({ Authorization: "Bearer abc" });
  });

  it("sin token no envia cabecera", () => {
    expect(cabeceraAuth()).toEqual({});
  });

  it("borrarToken elimina la sesion", () => {
    guardarToken("abc", 60);
    borrarToken();
    expect(leerToken()).toBeNull();
  });

  it("un 401 con token emite el evento de sesion expirada", () => {
    guardarToken("abc", 60);
    const oyente = jasmine.createSpy();
    window.addEventListener(EVENTO_SESION_EXPIRADA, oyente);
    avisarSiExpirada(401);
    avisarSiExpirada(500);
    window.removeEventListener(EVENTO_SESION_EXPIRADA, oyente);
    expect(oyente).toHaveBeenCalledTimes(1);
  });

  it("un 401 sin token no emite el evento", () => {
    const oyente = jasmine.createSpy();
    window.addEventListener(EVENTO_SESION_EXPIRADA, oyente);
    avisarSiExpirada(401);
    window.removeEventListener(EVENTO_SESION_EXPIRADA, oyente);
    expect(oyente).not.toHaveBeenCalled();
  });
});

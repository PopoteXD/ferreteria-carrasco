import { useEffect, useState } from "react";
import { REGIONES_COMUNAS } from "../data/regiones";
import { usuariosApiHabilitada, listarComunasApi, listarRegionesApi } from "../services/usuariosApi";

function RegionComuna({ region, comuna, onChange, errores = {} }) {
  const [regiones, setRegiones] = useState(() => Object.keys(REGIONES_COMUNAS));
  // Comunas cargadas desde ms-usuarios, cacheadas por región.
  const [comunasApi, setComunasApi] = useState({});

  // Regiones desde ms-usuarios; si falla se conservan las locales.
  useEffect(() => {
    if (!usuariosApiHabilitada) return undefined;
    let montado = true;
    listarRegionesApi()
      .then((lista) => {
        if (montado && Array.isArray(lista) && lista.length > 0) setRegiones(lista);
      })
      .catch(() => {});
    return () => {
      montado = false;
    };
  }, []);

  // Comunas según la región elegida (ms-usuarios, con el archivo local como respaldo).
  useEffect(() => {
    if (!region || !usuariosApiHabilitada || comunasApi[region]) return undefined;
    let montado = true;
    listarComunasApi(region)
      .then((lista) => {
        if (montado) setComunasApi((actual) => ({ ...actual, [region]: lista }));
      })
      .catch(() => {
        if (montado) {
          setComunasApi((actual) => ({ ...actual, [region]: REGIONES_COMUNAS[region] || [] }));
        }
      });
    return () => {
      montado = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

  const comunas = region ? comunasApi[region] ?? REGIONES_COMUNAS[region] ?? [] : [];

  return (
    <>
      <div className="campo-formulario">
        <label htmlFor="region">Región</label>
        <select
          id="region"
          name="region"
          value={region}
          onChange={onChange}
          className={errores.region ? "campo-invalido" : ""}
        >
          <option value="">Selecciona una región</option>
          {regiones.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        {errores.region && <small className="texto-error visible">{errores.region}</small>}
      </div>

      <div className="campo-formulario">
        <label htmlFor="comuna">Comuna</label>
        <select
          id="comuna"
          name="comuna"
          value={comuna}
          onChange={onChange}
          disabled={!region}
          className={errores.comuna ? "campo-invalido" : ""}
        >
          <option value="">Selecciona una comuna</option>
          {comunas.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {errores.comuna && <small className="texto-error visible">{errores.comuna}</small>}
      </div>
    </>
  );
}

export default RegionComuna;

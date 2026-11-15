import { useCallback, useEffect, useMemo, useState } from "react";
import {
  actualizarOfertaApi,
  cambiarActivaOfertaApi,
  crearOfertaApi,
  eliminarOfertaApi,
  listarOfertasApi,
  ofertasApiHabilitada,
} from "../services/ofertasApi";
import { ofertaVigente, precioConOferta } from "../utils/ofertas";
import { OfertasContext } from "./OfertasContext";

const CLAVE = "ofertas_carrasco";

function leerLocal() {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE) || "[]");
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

const fallo = (error) => ({ ok: false, mensaje: error.message });

export function OfertasProvider({ children }) {
  const [ofertas, setOfertas] = useState(() => (ofertasApiHabilitada ? [] : leerLocal()));
  const [cargandoOfertas, setCargando] = useState(ofertasApiHabilitada);
  const [errorOfertas, setError] = useState("");

  const recargarOfertas = useCallback(async () => {
    if (!ofertasApiHabilitada) return;
    setCargando(true);
    setError("");
    try {
      setOfertas(await listarOfertasApi());
    } catch (error) {
      setError(error.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!ofertasApiHabilitada) return undefined;
    let montado = true;
    listarOfertasApi()
      .then((lista) => {
        if (montado) setOfertas(lista);
      })
      .catch((error) => {
        // Sin ofertas la tienda sigue funcionando a precio normal.
        if (montado) setError(error.message);
      })
      .finally(() => {
        if (montado) setCargando(false);
      });
    return () => {
      montado = false;
    };
  }, []);

  useEffect(() => {
    if (!ofertasApiHabilitada) localStorage.setItem(CLAVE, JSON.stringify(ofertas));
  }, [ofertas]);

  const agregarOferta = useCallback(async (datos) => {
    if (ofertasApiHabilitada) {
      try {
        const guardada = await crearOfertaApi(datos);
        setOfertas((actual) => [guardada, ...actual]);
        return { ok: true, oferta: guardada };
      } catch (error) {
        return fallo(error);
      }
    }
    const nueva = { ...datos, id: Date.now() };
    setOfertas((actual) => [nueva, ...actual]);
    return { ok: true, oferta: nueva };
  }, []);

  const editarOferta = useCallback(async (id, datos) => {
    if (ofertasApiHabilitada) {
      try {
        const guardada = await actualizarOfertaApi(id, datos);
        setOfertas((actual) => actual.map((o) => (o.id === id ? guardada : o)));
        return { ok: true, oferta: guardada };
      } catch (error) {
        return fallo(error);
      }
    }
    setOfertas((actual) => actual.map((o) => (o.id === id ? { ...o, ...datos, id } : o)));
    return { ok: true };
  }, []);

  const alternarActiva = useCallback(async (id, activa) => {
    if (ofertasApiHabilitada) {
      try {
        const guardada = await cambiarActivaOfertaApi(id, activa);
        setOfertas((actual) => actual.map((o) => (o.id === id ? guardada : o)));
        return { ok: true };
      } catch (error) {
        return fallo(error);
      }
    }
    setOfertas((actual) => actual.map((o) => (o.id === id ? { ...o, activa } : o)));
    return { ok: true };
  }, []);

  const eliminarOferta = useCallback(async (id) => {
    if (ofertasApiHabilitada) {
      try {
        await eliminarOfertaApi(id);
      } catch (error) {
        return fallo(error);
      }
    }
    setOfertas((actual) => actual.filter((o) => o.id !== id));
    return { ok: true };
  }, []);

  const valor = useMemo(() => {
    const vigentes = ofertas.filter((o) => ofertaVigente(o));
    return {
      ofertas,
      vigentes,
      cargandoOfertas,
      errorOfertas,
      precioDe: (producto) => precioConOferta(producto, vigentes),
      recargarOfertas,
      agregarOferta,
      editarOferta,
      eliminarOferta,
      alternarActiva,
    };
  }, [ofertas, cargandoOfertas, errorOfertas, recargarOfertas, agregarOferta, editarOferta, eliminarOferta, alternarActiva]);

  return <OfertasContext.Provider value={valor}>{children}</OfertasContext.Provider>;
}

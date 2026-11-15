import { useEffect, useState } from "react";
import { PRODUCTOS_SEMILLA } from "../data/productos";
import {
  actualizarProducto as actualizarProductoApi,
  borrarProducto as borrarProductoApi,
  crearProducto as crearProductoApi,
  listarProductos,
  productosApiHabilitada,
} from "../services/productosApi";
import { ProductsContext } from "./ProductsContext";

const CLAVE = "productos_carrasco";

/**
 * Combina lo guardado en localStorage con la semilla actual.
 * Los datos del usuario tienen prioridad, pero si a un producto guardado
 * le faltan campos nuevos (stock, stockCritico, descripcion, imagen) se
 * completan con los de la semilla. Asi, datos antiguos no dejan el stock
 * vacio ni rompen la tienda.
 */
function normalizarProductos(guardado) {
  let lista;
  try {
    lista = JSON.parse(guardado);
  } catch {
    return PRODUCTOS_SEMILLA;
  }
  if (!Array.isArray(lista) || lista.length === 0) return PRODUCTOS_SEMILLA;

  return lista.map((p) => {
    const semilla = PRODUCTOS_SEMILLA.find((s) => s.codigo === p?.codigo);
    return semilla ? { ...semilla, ...p } : p;
  });
}

export function ProductsProvider({ children }) {
  const [productos, setProductos] = useState(() => {
    if (productosApiHabilitada) return [];
    const guardado = localStorage.getItem(CLAVE);
    return guardado ? normalizarProductos(guardado) : PRODUCTOS_SEMILLA;
  });
  const [cargandoProductos, setCargandoProductos] = useState(productosApiHabilitada);
  const [errorProductos, setErrorProductos] = useState("");

  async function recargarProductos() {
    if (!productosApiHabilitada) return;
    setCargandoProductos(true);
    setErrorProductos("");
    try {
      setProductos(await listarProductos());
    } catch (error) {
      setProductos([]);
      setErrorProductos(error.message);
    } finally {
      setCargandoProductos(false);
    }
  }

  useEffect(() => {
    if (!productosApiHabilitada) return undefined;

    let montado = true;
    listarProductos()
      .then((lista) => {
        if (montado) setProductos(lista);
      })
      .catch((error) => {
        if (montado) {
          setProductos([]);
          setErrorProductos(error.message);
        }
      })
      .finally(() => {
        if (montado) setCargandoProductos(false);
      });

    return () => {
      montado = false;
    };
  }, []);

  useEffect(() => {
    if (!productosApiHabilitada) {
      localStorage.setItem(CLAVE, JSON.stringify(productos));
    }
  }, [productos]);

  function agregarProducto(producto) {
    if (productos.some((p) => p.codigo === producto.codigo)) {
      return { ok: false, mensaje: "Ya existe un producto con ese código" };
    }
    if (productosApiHabilitada) {
      return crearProductoApi(producto)
        .then((guardado) => {
          setProductos((actual) => [...actual, guardado]);
          return { ok: true };
        })
        .catch((error) => ({ ok: false, mensaje: error.message }));
    }
    setProductos((actual) => [...actual, producto]);
    return { ok: true };
  }

  function editarProducto(codigo, datos) {
    if (productosApiHabilitada) {
      return actualizarProductoApi(codigo, datos)
        .then((guardado) => {
          setProductos((actual) => actual.map((p) => (p.codigo === codigo ? guardado : p)));
          return { ok: true };
        })
        .catch((error) => ({ ok: false, mensaje: error.message }));
    }
    setProductos((actual) => actual.map((p) => (p.codigo === codigo ? { ...p, ...datos } : p)));
    return { ok: true };
  }

  function eliminarProducto(codigo) {
    const eliminarLocal = () => setProductos((actual) => actual.filter((p) => p.codigo !== codigo));
    if (productosApiHabilitada) {
      return borrarProductoApi(codigo)
        .then(() => {
          eliminarLocal();
          return { ok: true };
        })
        .catch((error) => ({ ok: false, mensaje: error.message }));
    }
    eliminarLocal();
    return { ok: true };
  }

  // descuenta stock de una compra, sin bajar nunca de 0
  function descontarStock(codigo, cantidad) {
    const producto = productos.find((p) => p.codigo === codigo);
    if (!producto) return { ok: false, mensaje: "Producto no encontrado" };
    const actualizado = { ...producto, stock: Math.max(0, (producto.stock ?? 0) - cantidad) };
    if (productosApiHabilitada) {
      return actualizarProductoApi(codigo, actualizado)
        .then((guardado) => {
          setProductos((actual) => actual.map((p) => (p.codigo === codigo ? guardado : p)));
          return { ok: true };
        })
        .catch((error) => ({ ok: false, mensaje: error.message }));
    }
    setProductos((actual) => actual.map((p) => (p.codigo === codigo ? actualizado : p)));
    return { ok: true };
  }

  return (
    <ProductsContext.Provider
      value={{
        productos,
        agregarProducto,
        editarProducto,
        eliminarProducto,
        descontarStock,
        cargandoProductos,
        errorProductos,
        recargarProductos,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

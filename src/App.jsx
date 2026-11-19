import "./estilos.css";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Productos from "./components/Productos";
import ProductoDetalle from "./components/ProductoDetalle";
import Ofertas from "./components/Ofertas";
import Carrito from "./components/Carrito";
import Login from "./components/Login";
import Registro from "./components/Registro";
import Perfil from "./components/Perfil";
import Nosotros from "./components/Nosotros";
import Contacto from "./components/Contacto";
import RutaAdmin, { RutaSoloAdmin } from "./components/RutaAdmin";
import LayoutAdmin from "./components/LayoutAdmin";
import AdminDashboard from "./components/AdminDashboard";
import AdminProductos from "./components/AdminProductos";
import AdminProductoForm from "./components/AdminProductoForm";
import AdminPedidos from "./components/AdminPedidos";
import AdminUsuarios from "./components/AdminUsuarios";
import AdminResenas from "./components/AdminResenas";
import AdminOfertas from "./components/AdminOfertas";
import AdminOfertaForm from "./components/AdminOfertaForm";

function App() {
  const { pathname } = useLocation();
  const enAdmin = pathname.startsWith("/admin");

  return (
    <>
      {!enAdmin && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/producto/:codigo" element={<ProductoDetalle />} />
        <Route path="/ofertas" element={<Ofertas />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/contacto" element={<Contacto />} />

        {/* rutas anidadas del panel, protegidas */}
        <Route path="/admin" element={<RutaAdmin><LayoutAdmin /></RutaAdmin>}>
          <Route index element={<RutaSoloAdmin><AdminDashboard /></RutaSoloAdmin>} />
          <Route path="pedidos" element={<AdminPedidos />} />
          <Route path="ofertas" element={<RutaSoloAdmin><AdminOfertas /></RutaSoloAdmin>} />
          <Route path="ofertas/nueva" element={<RutaSoloAdmin><AdminOfertaForm /></RutaSoloAdmin>} />
          <Route path="ofertas/editar/:id" element={<RutaSoloAdmin><AdminOfertaForm /></RutaSoloAdmin>} />
          <Route path="usuarios" element={<RutaSoloAdmin><AdminUsuarios /></RutaSoloAdmin>} />
          <Route path="resenas" element={<RutaSoloAdmin><AdminResenas /></RutaSoloAdmin>} />
          <Route path="productos" element={<AdminProductos />} />
          <Route path="productos/nuevo" element={<RutaSoloAdmin><AdminProductoForm /></RutaSoloAdmin>} />
          <Route path="productos/editar/:codigo" element={<RutaSoloAdmin><AdminProductoForm /></RutaSoloAdmin>} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
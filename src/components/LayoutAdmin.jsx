import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const OPCIONES = [
  { to: "/admin", texto: "Resumen", icono: "📊", end: true },
  { to: "/admin/pedidos", texto: "Pedidos", icono: "🧾" },
  { to: "/admin/productos", texto: "Productos", icono: "📦" },
  { to: "/admin/ofertas", texto: "Ofertas", icono: "🏷️" },
  { to: "/admin/usuarios", texto: "Usuarios", icono: "👥" },
  { to: "/admin/resenas", texto: "Reseñas", icono: "⭐" },
  { to: "/", texto: "Ver tienda", icono: "🌐" },
];

function LayoutAdmin() {
  const { usuario } = useAuth();

  return (
    <div className="diseno-admin">
      <aside className="admin-lateral">
        <div className="marca-admin">
          Carrasco
          <br />
          <small>PANEL ADMIN</small>
        </div>
        <nav aria-label="Navegación del panel">
          {OPCIONES.map((o) => (
            <NavLink key={o.to} to={o.to} end={o.end}>
              <span aria-hidden="true">{o.icono}</span> {o.texto}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="admin-principal">
        <div className="admin-encabezado">
          <h1>Panel administrador</h1>
          <span>Hola, <strong>{usuario.nombre} {usuario.apellidos}</strong></span>
        </div>
        <div className="admin-contenido">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default LayoutAdmin;

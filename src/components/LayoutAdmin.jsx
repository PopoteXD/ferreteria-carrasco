import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const OPCIONES = [
  { to: "/admin", texto: "Resumen", icono: "📊", end: true, soloAdmin: true },
  { to: "/admin/pedidos", texto: "Pedidos", icono: "🧾" },
  { to: "/admin/productos", texto: "Productos", icono: "📦" },
  { to: "/admin/ofertas", texto: "Ofertas", icono: "🏷️", soloAdmin: true },
  { to: "/admin/usuarios", texto: "Usuarios", icono: "👥", soloAdmin: true },
  { to: "/admin/resenas", texto: "Reseñas", icono: "⭐", soloAdmin: true },
  { to: "/", texto: "Ver tienda", icono: "🌐" },
];

function LayoutAdmin() {
  const { usuario } = useAuth();
  const esAdmin = usuario.tipoUsuario === "Administrador";
  const opciones = OPCIONES.filter((o) => esAdmin || !o.soloAdmin);

  return (
    <div className="diseno-admin">
      <aside className="admin-lateral">
        <div className="marca-admin">
          Carrasco
          <br />
          <small>{esAdmin ? "PANEL ADMIN" : "PANEL VENDEDOR"}</small>
        </div>
        <nav aria-label="Navegación del panel">
          {opciones.map((o) => (
            <NavLink key={o.to} to={o.to} end={o.end}>
              <span aria-hidden="true">{o.icono}</span> {o.texto}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="admin-principal">
        <div className="admin-encabezado">
          <h1>{esAdmin ? "Panel administrador" : "Panel de vendedor"}</h1>
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

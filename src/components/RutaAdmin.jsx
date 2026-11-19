import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLES_PANEL = ["Administrador", "Vendedor"];

function RutaAdmin({ children }) {
  const { usuario } = useAuth();

  if (!usuario || !ROLES_PANEL.includes(usuario.tipoUsuario)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function RutaSoloAdmin({ children }) {
  const { usuario } = useAuth();

  if (!usuario || usuario.tipoUsuario !== "Administrador") {
    return <Navigate to="/admin/productos" replace />;
  }
  return children;
}

export default RutaAdmin;
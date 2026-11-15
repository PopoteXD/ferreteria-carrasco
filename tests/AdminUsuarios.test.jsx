import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ usuario: { run: "145202027", correo: "luis.ferreteria373@gmail.com", tipoUsuario: "Administrador" } }),
}));

import AdminUsuarios from "../src/components/AdminUsuarios";

const propietario = {
  run: "145202027", nombre: "Ferreteria", apellidos: "Carrasco",
  correo: "luis.ferreteria373@gmail.com", clave: "admin123", tipoUsuario: "Administrador",
};
const cliente = {
  run: "111111111", nombre: "Ana", apellidos: "Perez",
  correo: "ana@duoc.cl", clave: "abc123", tipoUsuario: "Cliente",
};

describe("AdminUsuarios (CRUD)", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("usuarios_carrasco", JSON.stringify([propietario, cliente]));
  });

  it("crea un usuario nuevo", async () => {
    const u = userEvent.setup();
    render(<AdminUsuarios />);
    await u.click(screen.getByRole("button", { name: "Nuevo usuario" }));
    await u.type(screen.getByLabelText(/RUN/), "222222222");
    await u.type(screen.getByLabelText("Correo"), "nuevo@duoc.cl");
    await u.type(screen.getByLabelText("Nombre"), "Nuevo");
    await u.type(screen.getByLabelText("Apellidos"), "Usuario");
    await u.type(screen.getByLabelText("Clave"), "clave123");
    await u.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Usuario creado.")).toBeInTheDocument();
    expect(screen.getByText("nuevo@duoc.cl")).toBeInTheDocument();
  });

  it("valida campos obligatorios al crear", async () => {
    const u = userEvent.setup();
    render(<AdminUsuarios />);
    await u.click(screen.getByRole("button", { name: "Nuevo usuario" }));
    await u.click(screen.getByRole("button", { name: "Guardar" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/obligatorios/);
  });

  it("edita el nombre de un usuario", async () => {
    const u = userEvent.setup();
    render(<AdminUsuarios />);
    const fila = screen.getByText("ana@duoc.cl").closest("tr");
    await u.click(fila.querySelector("button"));
    const nombre = screen.getByLabelText("Nombre");
    await u.clear(nombre);
    await u.type(nombre, "Anita");
    await u.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Usuario actualizado.")).toBeInTheDocument();
    expect(screen.getByText(/Anita Perez/)).toBeInTheDocument();
  });

  it("desactiva y reactiva un usuario", async () => {
    const u = userEvent.setup();
    render(<AdminUsuarios />);
    await u.click(screen.getByRole("button", { name: "Desactivar" }));
    expect(await screen.findByText("Ana ahora está inactivo.")).toBeInTheDocument();
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Activar" }));
    expect(await screen.findByText("Ana ahora está activo.")).toBeInTheDocument();
  });

  it("no permite desactivar ni eliminar al propietario", () => {
    render(<AdminUsuarios />);
    expect(screen.getByText(/Propietario/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Desactivar" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Eliminar" })).toHaveLength(1);
  });
});

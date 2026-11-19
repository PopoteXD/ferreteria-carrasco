package cl.ferreteriacarrasco.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RolRequest(
        @NotBlank(message = "El rol es obligatorio")
        @Pattern(regexp = "Cliente|Administrador|Vendedor", message = "Rol permitido: Cliente, Vendedor o Administrador")
        String tipoUsuario) {
}

package cl.ferreteriacarrasco.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UsuarioAdminRequest(
        @NotBlank(message = "El RUN es obligatorio")
        @Pattern(regexp = "^[0-9]{7,8}[0-9kK]$", message = "RUN sin puntos ni guion (ej: 123456785)")
        String run,
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 50, message = "El nombre no puede superar 50 caracteres")
        String nombre,
        @NotBlank(message = "Los apellidos son obligatorios")
        @Size(max = 100, message = "Los apellidos no pueden superar 100 caracteres")
        String apellidos,
        @NotBlank(message = "El correo es obligatorio")
        @Size(max = 100, message = "El correo no puede superar 100 caracteres")
        @Pattern(regexp = "(?i)^[^\\s@]+@(duoc\\.cl|profesor\\.duoc\\.cl|gmail\\.com)$",
                message = "Usa un correo @duoc.cl, @profesor.duoc.cl o @gmail.com")
        String correo,
        @NotBlank(message = "La clave es obligatoria")
        @Size(min = 6, max = 60, message = "La clave debe tener entre 6 y 60 caracteres")
        String clave,
        @NotBlank(message = "El rol es obligatorio")
        @Pattern(regexp = "Cliente|Administrador|Vendedor", message = "Rol permitido: Cliente, Vendedor o Administrador")
        String tipoUsuario,
        @Size(max = 80, message = "Región demasiado larga") String region,
        @Size(max = 80, message = "Comuna demasiado larga") String comuna,
        @Size(max = 150, message = "Dirección demasiado larga") String direccion) {

    public RegistroRequest aRegistro() {
        return new RegistroRequest(run, nombre, apellidos, correo, clave, region, comuna, direccion);
    }
}

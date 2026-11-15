package cl.ferreteriacarrasco.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PerfilRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 50, message = "El nombre no puede superar 50 caracteres")
        String nombre,
        @NotBlank(message = "Los apellidos son obligatorios")
        @Size(max = 100, message = "Los apellidos no pueden superar 100 caracteres")
        String apellidos,
        @Size(max = 12, message = "RUN demasiado largo") String run,
        @Size(max = 80, message = "Región demasiado larga") String region,
        @Size(max = 80, message = "Comuna demasiado larga") String comuna,
        @Size(max = 150, message = "Dirección demasiado larga") String direccion,
        @Size(min = 6, max = 60, message = "La clave debe tener entre 6 y 60 caracteres") String clave) {
}

package cl.ferreteriacarrasco.pedidos.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record PedidoRequest(
        @NotNull(message = "El cliente es obligatorio") @Valid Cliente cliente,
        @NotEmpty(message = "El pedido debe tener al menos un producto") @Valid List<Linea> lineas) {

    public record Cliente(
            @NotBlank(message = "El nombre del cliente es obligatorio")
            @Size(max = 100, message = "Nombre demasiado largo") String nombre,
            @NotBlank(message = "El correo del cliente es obligatorio")
            @Size(max = 100, message = "Correo demasiado largo") String correo) {
    }

    public record Linea(
            @NotBlank(message = "El código es obligatorio") @Size(max = 20, message = "Código demasiado largo") String codigo,
            @Size(max = 100, message = "Nombre demasiado largo") String nombre,
            @Min(value = 0, message = "El precio no puede ser negativo") Integer precio,
            @NotNull(message = "La cantidad es obligatoria") @Min(value = 1, message = "La cantidad mínima es 1") Integer cantidad) {
    }
}

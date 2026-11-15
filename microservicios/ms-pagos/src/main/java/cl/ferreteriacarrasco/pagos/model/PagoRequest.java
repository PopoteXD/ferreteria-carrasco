package cl.ferreteriacarrasco.pagos.model;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record PagoRequest(
        @NotBlank(message = "El pedido es obligatorio") String pedidoId,
        @NotBlank(message = "El método de pago es obligatorio")
        @Pattern(regexp = "Débito|Crédito|Transferencia", message = "Método permitido: Débito, Crédito o Transferencia")
        String metodo,
        @NotNull(message = "El monto es obligatorio") @Min(value = 1, message = "El monto debe ser mayor a 0")
        Integer monto) {
}

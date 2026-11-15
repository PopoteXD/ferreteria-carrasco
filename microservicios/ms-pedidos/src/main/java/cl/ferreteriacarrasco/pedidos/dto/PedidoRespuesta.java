package cl.ferreteriacarrasco.pedidos.dto;

import cl.ferreteriacarrasco.pedidos.model.Pedido;
import java.time.LocalDateTime;
import java.util.List;

public record PedidoRespuesta(String id, LocalDateTime fecha, Cliente cliente, List<Linea> lineas,
                              Integer subtotal, Integer envio, Integer total, String estado) {

    public record Cliente(String nombre, String correo) {
    }

    public record Linea(String codigo, String nombre, Integer precio, Integer cantidad) {
    }

    public static PedidoRespuesta de(Pedido p) {
        return new PedidoRespuesta(p.codigo(), p.getFecha(),
                new Cliente(p.getClienteNombre(), p.getClienteCorreo()),
                p.getLineas().stream()
                        .map(l -> new Linea(l.getCodigo(), l.getNombre(), l.getPrecio(), l.getCantidad())).toList(),
                p.getSubtotal(), p.getEnvio(), p.getTotal(), p.getEstado());
    }
}

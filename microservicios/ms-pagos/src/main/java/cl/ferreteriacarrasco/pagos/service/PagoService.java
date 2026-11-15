package cl.ferreteriacarrasco.pagos.service;

import cl.ferreteriacarrasco.pagos.model.Pago;
import cl.ferreteriacarrasco.pagos.model.PagoRequest;
import cl.ferreteriacarrasco.pagos.repository.PagoRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class PagoService {

    private final PagoRepository repository;

    public PagoService(PagoRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Pago> listar(String pedidoId) {
        if (pedidoId != null && !pedidoId.isBlank()) {
            return repository.findByPedidoIdOrderByIdDesc(pedidoId);
        }
        return repository.findAllByOrderByIdDesc();
    }

    @Transactional(readOnly = true)
    public Pago obtener(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pago no encontrado"));
    }

    /** Simulación: transferencia queda Pendiente; débito y crédito se aprueban al instante. */
    public Pago registrar(PagoRequest datos) {
        boolean yaAprobado = repository.findByPedidoIdOrderByIdDesc(datos.pedidoId()).stream()
                .anyMatch(p -> "Aprobado".equals(p.getEstado()));
        if (yaAprobado) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El pedido ya tiene un pago aprobado");
        }
        Pago pago = new Pago();
        pago.setPedidoId(datos.pedidoId());
        pago.setMetodo(datos.metodo());
        pago.setMonto(datos.monto());
        pago.setEstado("Transferencia".equals(datos.metodo()) ? "Pendiente" : "Aprobado");
        pago.setReferencia("PAG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        pago.setFecha(LocalDateTime.now());
        return repository.save(pago);
    }

    /** Confirma una transferencia pendiente (acción de administración). */
    public Pago confirmar(Long id) {
        Pago pago = obtener(id);
        if (!"Pendiente".equals(pago.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se pueden confirmar pagos pendientes");
        }
        pago.setEstado("Aprobado");
        return repository.save(pago);
    }
}

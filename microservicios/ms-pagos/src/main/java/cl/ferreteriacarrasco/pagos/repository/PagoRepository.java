package cl.ferreteriacarrasco.pagos.repository;

import cl.ferreteriacarrasco.pagos.model.Pago;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PagoRepository extends JpaRepository<Pago, Long> {

    List<Pago> findAllByOrderByIdDesc();

    List<Pago> findByPedidoIdOrderByIdDesc(String pedidoId);
}

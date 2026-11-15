package cl.ferreteriacarrasco.pedidos.repository;

import cl.ferreteriacarrasco.pedidos.model.Pedido;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findAllByOrderByIdDesc();

    List<Pedido> findByClienteCorreoIgnoreCaseOrderByIdDesc(String clienteCorreo);
}

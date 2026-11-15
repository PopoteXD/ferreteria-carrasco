package cl.ferreteriacarrasco.productos.repository;

import cl.ferreteriacarrasco.productos.model.Oferta;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OfertaRepository extends JpaRepository<Oferta, Long> {

    List<Oferta> findAllByOrderByIdDesc();
}

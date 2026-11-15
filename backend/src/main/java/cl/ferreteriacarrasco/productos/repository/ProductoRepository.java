package cl.ferreteriacarrasco.productos.repository;

import cl.ferreteriacarrasco.productos.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductoRepository extends JpaRepository<Producto, String> {
}

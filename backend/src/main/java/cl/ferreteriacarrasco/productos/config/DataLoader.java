package cl.ferreteriacarrasco.productos.config;

import cl.ferreteriacarrasco.productos.model.Producto;
import cl.ferreteriacarrasco.productos.repository.ProductoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner cargarProductos(ProductoRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                repository.save(new Producto("HM001", "Martillo de Uña 16 oz", "herramientas-manuales", 7990, 42, 8, "Martillo de uña con mango de fibra de vidrio antideslizante.", "/img/productos/martillo.jpg"));
                repository.save(new Producto("HM002", "Juego de Destornilladores 6 piezas", "herramientas-manuales", 9990, 30, 6, "Set de destornilladores planos y phillips con mango ergonomico.", "/img/productos/destornilladores.jpg"));
                repository.save(new Producto("HM003", "Llave Ajustable 10 pulgadas", "herramientas-manuales", 6490, 25, 5, "Llave inglesa de acero al cromo vanadio.", "/img/productos/llave-ajustable.jpg"));
                repository.save(new Producto("HE001", "Taladro Percutor 750W", "herramientas-electricas", 44990, 2, 3, "Taladro percutor de doble velocidad con maletin incluido.", "/img/productos/taladro.jpg"));
                repository.save(new Producto("HE002", "Amoladora Angular 4.5 pulgadas", "herramientas-electricas", 32990, 12, 3, "Amoladora de 820W con proteccion de disco ajustable.", "/img/productos/amoladora.jpg"));
                repository.save(new Producto("MC001", "Cemento Gris 25 kg", "materiales-construccion", 6890, 120, 20, "Cemento Portland de uso general para albañileria.", "/img/productos/cemento.jpg"));
                repository.save(new Producto("PI001", "Pintura Latex Interior 1 galon", "pinturas-selladores", 15990, 5, 8, "Latex lavable de alto poder cubriente, terminacion mate.", "/img/productos/pintura-latex.jpg"));
                repository.save(new Producto("PL001", "Llave de Paso PVC 20mm", "plomeria", 2990, 55, 10, "Llave de corte de PVC roscada.", "/img/productos/llave-paso.jpg"));
                repository.save(new Producto("EL001", "Cable Electrico 2.5mm (rollo 20m)", "electricidad", 13990, 18, 4, "Cable de cobre, aislacion 600V.", "/img/productos/cable.jpg"));
                repository.save(new Producto("SE001", "Casco de Seguridad Ajustable", "seguridad", 8990, 20, 5, "Casco tipo jockey con matraca de ajuste.", "/img/productos/casco.jpg"));
                repository.save(new Producto("JA001", "Manguera de Jardin 15 m", "jardin-exterior", 11990, 20, 4, "Manguera reforzada con pistola rociadora.", "/img/productos/manguera.jpg"));
            }
        };
    }
}

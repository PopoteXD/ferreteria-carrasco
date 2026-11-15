package cl.ferreteriacarrasco.usuarios.config;

import cl.ferreteriacarrasco.usuarios.dto.RegistroRequest;
import cl.ferreteriacarrasco.usuarios.repository.UsuarioRepository;
import cl.ferreteriacarrasco.usuarios.service.UsuarioService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Crea un administrador inicial. La clave sale de la variable ADMIN_CLAVE; el valor por defecto es solo para
 * desarrollo y DEBE cambiarse antes de publicar el sitio.
 */
@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner cargarAdministrador(UsuarioRepository repository, UsuarioService service,
                                          @Value("${app.admin.correo:luis.ferreteria373@gmail.com}") String correo,
                                          @Value("${app.admin.clave:admin123}") String clave) {
        return args -> {
            service.asegurarPropietario(new RegistroRequest("145202027", "Administrador", "Ferretería Carrasco",
                    correo, clave, null, null, null));
        };
    }
}

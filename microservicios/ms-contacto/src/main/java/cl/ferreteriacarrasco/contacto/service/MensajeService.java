package cl.ferreteriacarrasco.contacto.service;

import cl.ferreteriacarrasco.contacto.model.Mensaje;
import cl.ferreteriacarrasco.contacto.repository.MensajeRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class MensajeService {

    private final MensajeRepository repository;

    public MensajeService(MensajeRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Mensaje> listar() {
        return repository.findAllByOrderByIdDesc();
    }

    public Mensaje crear(Mensaje mensaje) {
        mensaje.setFecha(LocalDateTime.now());
        mensaje.setLeido(false);
        return repository.save(mensaje);
    }

    public Mensaje marcarLeido(Long id, boolean leido) {
        Mensaje m = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mensaje no encontrado"));
        m.setLeido(leido);
        return repository.save(m);
    }

    public void eliminar(Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Mensaje no encontrado");
        }
        repository.deleteById(id);
    }
}

package cl.ferreteriacarrasco.contacto.controller;

import cl.ferreteriacarrasco.contacto.model.Mensaje;
import cl.ferreteriacarrasco.contacto.service.MensajeService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contacto")
public class MensajeController {

    private final MensajeService service;

    public MensajeController(MensajeService service) {
        this.service = service;
    }

    @GetMapping
    public List<Mensaje> listar() {
        return service.listar();
    }

    @PostMapping
    public ResponseEntity<Mensaje> crear(@Valid @RequestBody Mensaje mensaje) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(mensaje));
    }

    @PatchMapping("/{id}/leido")
    public Mensaje marcarLeido(@PathVariable Long id, @RequestParam(defaultValue = "true") boolean valor) {
        return service.marcarLeido(id, valor);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}

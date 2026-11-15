package cl.ferreteriacarrasco.productos.controller;

import cl.ferreteriacarrasco.productos.model.Oferta;
import cl.ferreteriacarrasco.productos.service.OfertaService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ofertas")
public class OfertaController {

    private final OfertaService service;

    public OfertaController(OfertaService service) {
        this.service = service;
    }

    @GetMapping
    public List<Oferta> listar() {
        return service.listar();
    }

    @GetMapping("/vigentes")
    public List<Oferta> vigentes() {
        return service.vigentes();
    }

    @GetMapping("/precio/{codigo}")
    public Map<String, Object> precio(@PathVariable String codigo) {
        return service.precio(codigo);
    }

    @GetMapping("/{id}")
    public Oferta obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @PostMapping
    public ResponseEntity<Oferta> crear(@Valid @RequestBody Oferta oferta) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(oferta));
    }

    @PutMapping("/{id}")
    public Oferta actualizar(@PathVariable Long id, @Valid @RequestBody Oferta oferta) {
        return service.actualizar(id, oferta);
    }

    @PatchMapping("/{id}/activa")
    public Oferta cambiarActiva(@PathVariable Long id, @RequestParam(defaultValue = "true") boolean valor) {
        return service.cambiarActiva(id, valor);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}

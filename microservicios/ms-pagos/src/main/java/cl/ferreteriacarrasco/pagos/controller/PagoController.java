package cl.ferreteriacarrasco.pagos.controller;

import cl.ferreteriacarrasco.pagos.model.Pago;
import cl.ferreteriacarrasco.pagos.model.PagoRequest;
import cl.ferreteriacarrasco.pagos.service.PagoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/pagos", "/api/v1/pagos"})
public class PagoController {

    private final PagoService service;

    public PagoController(PagoService service) {
        this.service = service;
    }

    @GetMapping
    public List<Pago> listar(@RequestParam(required = false) String pedidoId) {
        return service.listar(pedidoId);
    }

    @GetMapping("/{id}")
    public Pago obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @PostMapping
    public ResponseEntity<Pago> registrar(@Valid @RequestBody PagoRequest datos) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.registrar(datos));
    }

    @PatchMapping("/{id}/confirmar")
    public Pago confirmar(@PathVariable Long id) {
        return service.confirmar(id);
    }
}

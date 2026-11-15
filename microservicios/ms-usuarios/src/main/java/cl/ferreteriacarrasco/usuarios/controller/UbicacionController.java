package cl.ferreteriacarrasco.usuarios.controller;

import cl.ferreteriacarrasco.usuarios.model.Ubicaciones;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/ubicaciones")
public class UbicacionController {

    @GetMapping
    public Map<String, List<String>> todas() {
        return Ubicaciones.REGIONES_COMUNAS;
    }

    @GetMapping("/regiones")
    public List<String> regiones() {
        return List.copyOf(Ubicaciones.REGIONES_COMUNAS.keySet());
    }

    @GetMapping("/comunas")
    public List<String> comunas(@org.springframework.web.bind.annotation.RequestParam String region) {
        List<String> comunas = Ubicaciones.REGIONES_COMUNAS.get(region);
        if (comunas == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Región no encontrada");
        }
        return comunas;
    }
}

package cl.ferreteriacarrasco.pedidos.controller;

import cl.ferreteriacarrasco.pedidos.dto.EstadoRequest;
import cl.ferreteriacarrasco.pedidos.dto.PedidoRequest;
import cl.ferreteriacarrasco.pedidos.dto.PedidoRespuesta;
import cl.ferreteriacarrasco.pedidos.service.PedidoService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;
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
@RequestMapping({"/api/pedidos", "/api/v1/pedidos"})
public class PedidoController {

    private final PedidoService service;

    public PedidoController(PedidoService service) {
        this.service = service;
    }

    private static boolean esAdmin(JwtAuthenticationToken auth) {
        return auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    private static boolean esDelCliente(JwtAuthenticationToken auth, String correo) {
        return correo != null && correo.equalsIgnoreCase(auth.getToken().getSubject());
    }

    @GetMapping
    public List<PedidoRespuesta> listar(@RequestParam(required = false) String correo, JwtAuthenticationToken auth) {
        String filtro = esAdmin(auth) ? correo : auth.getToken().getSubject();
        return service.listar(filtro).stream().map(PedidoRespuesta::de).toList();
    }

    @GetMapping("/resumen")
    public Map<String, Object> resumen() {
        return service.resumen();
    }

    @GetMapping("/{id}")
    public PedidoRespuesta obtener(@PathVariable String id, JwtAuthenticationToken auth) {
        PedidoRespuesta pedido = PedidoRespuesta.de(service.obtener(id));
        if (!esAdmin(auth) && !esDelCliente(auth, pedido.cliente().correo())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes ver pedidos de otros clientes");
        }
        return pedido;
    }

    @PostMapping
    public ResponseEntity<PedidoRespuesta> crear(@Valid @RequestBody PedidoRequest datos, JwtAuthenticationToken auth) {
        if (!esAdmin(auth) && !esDelCliente(auth, datos.cliente().correo())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El pedido debe ser a nombre de tu cuenta");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(PedidoRespuesta.de(service.crear(datos)));
    }

    @PatchMapping("/{id}/estado")
    public PedidoRespuesta cambiarEstado(@PathVariable String id, @Valid @RequestBody EstadoRequest datos) {
        return PedidoRespuesta.de(service.cambiarEstado(id, datos.estado()));
    }
}

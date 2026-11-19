package cl.ferreteriacarrasco.usuarios.controller;

import cl.ferreteriacarrasco.usuarios.dto.PerfilRequest;
import cl.ferreteriacarrasco.usuarios.dto.EstadoRequest;
import cl.ferreteriacarrasco.usuarios.dto.RolRequest;
import cl.ferreteriacarrasco.usuarios.dto.UsuarioAdminRequest;
import cl.ferreteriacarrasco.usuarios.dto.UsuarioRespuesta;
import cl.ferreteriacarrasco.usuarios.service.UsuarioService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping({"/api/usuarios", "/api/v1/usuarios"})
public class UsuarioController {

    private final UsuarioService service;

    public UsuarioController(UsuarioService service) {
        this.service = service;
    }

    @GetMapping
    public List<UsuarioRespuesta> listar() {
        return service.listar().stream().map(UsuarioRespuesta::de).toList();
    }

    @PostMapping
    public ResponseEntity<UsuarioRespuesta> crear(@Valid @RequestBody UsuarioAdminRequest datos) {
        return ResponseEntity.status(HttpStatus.CREATED).body(UsuarioRespuesta.de(service.crearPorAdmin(datos)));
    }

    private static void soloPropioOAdmin(Long id, JwtAuthenticationToken auth) {
        boolean admin = auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
        Object uid = auth.getToken().getClaim("uid");
        boolean propio = uid instanceof Number n && n.longValue() == id;
        if (!admin && !propio) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes acceder a los datos de otro usuario");
        }
    }

    @GetMapping("/{id}")
    public UsuarioRespuesta obtener(@PathVariable Long id, JwtAuthenticationToken auth) {
        soloPropioOAdmin(id, auth);
        return UsuarioRespuesta.de(service.obtener(id));
    }

    @PutMapping("/{id}")
    public UsuarioRespuesta actualizarPerfil(@PathVariable Long id, @Valid @RequestBody PerfilRequest datos,
                                             JwtAuthenticationToken auth) {
        soloPropioOAdmin(id, auth);
        return UsuarioRespuesta.de(service.actualizarPerfil(id, datos));
    }

    @PatchMapping("/{id}/rol")
    public UsuarioRespuesta cambiarRol(@PathVariable Long id, @Valid @RequestBody RolRequest datos) {
        return UsuarioRespuesta.de(service.cambiarRol(id, datos));
    }

    @PatchMapping("/{id}/estado")
    public UsuarioRespuesta cambiarEstado(@PathVariable Long id, @Valid @RequestBody EstadoRequest datos) {
        return UsuarioRespuesta.de(service.cambiarEstado(id, datos.activo()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}

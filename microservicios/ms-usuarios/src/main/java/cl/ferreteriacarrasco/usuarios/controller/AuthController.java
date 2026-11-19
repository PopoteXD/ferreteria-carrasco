package cl.ferreteriacarrasco.usuarios.controller;

import cl.ferreteriacarrasco.usuarios.dto.LoginRequest;
import cl.ferreteriacarrasco.usuarios.dto.RegistroRequest;
import cl.ferreteriacarrasco.usuarios.dto.SesionRespuesta;
import cl.ferreteriacarrasco.usuarios.dto.UsuarioRespuesta;
import cl.ferreteriacarrasco.usuarios.model.Usuario;
import cl.ferreteriacarrasco.usuarios.service.TokenService;
import cl.ferreteriacarrasco.usuarios.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping({"/api/auth", "/api/v1/auth"})
public class AuthController {

    private final UsuarioService service;
    private final TokenService tokens;

    public AuthController(UsuarioService service, TokenService tokens) {
        this.service = service;
        this.tokens = tokens;
    }

    private SesionRespuesta sesion(Usuario u) {
        return new SesionRespuesta(tokens.generar(u), tokens.segundosDeVida(), UsuarioRespuesta.de(u));
    }

    @PostMapping("/register")
    public ResponseEntity<SesionRespuesta> registrar(@Valid @RequestBody RegistroRequest datos) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sesion(service.registrar(datos)));
    }

    @PostMapping("/login")
    public SesionRespuesta login(@Valid @RequestBody LoginRequest datos) {
        return sesion(service.iniciarSesion(datos));
    }

    @PostMapping("/refresh")
    public SesionRespuesta renovar(JwtAuthenticationToken auth) {
        Usuario u = service.obtener(((Number) auth.getToken().getClaim("uid")).longValue());
        if (!u.isActivo()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La cuenta está desactivada");
        }
        return sesion(u);
    }
}

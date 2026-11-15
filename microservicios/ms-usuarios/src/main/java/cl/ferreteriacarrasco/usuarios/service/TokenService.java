package cl.ferreteriacarrasco.usuarios.service;

import cl.ferreteriacarrasco.usuarios.model.Usuario;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

    private final JwtEncoder encoder;
    private final long minutos;

    public TokenService(JwtEncoder encoder, @Value("${app.jwt.minutos:60}") long minutos) {
        this.encoder = encoder;
        this.minutos = minutos;
    }

    public static String rolDe(Usuario u) {
        return UsuarioService.ADMINISTRADOR.equals(u.getTipoUsuario()) ? "ADMIN" : "CLIENTE";
    }

    public String generar(Usuario u) {
        Instant ahora = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("ferreteria-carrasco")
                .subject(u.getCorreo())
                .issuedAt(ahora)
                .expiresAt(ahora.plusSeconds(minutos * 60))
                .claim("uid", u.getId())
                .claim("rol", rolDe(u))
                .build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();
    }

    public long segundosDeVida() {
        return minutos * 60;
    }
}

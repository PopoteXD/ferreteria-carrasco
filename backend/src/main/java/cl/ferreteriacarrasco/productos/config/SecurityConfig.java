package cl.ferreteriacarrasco.productos.config;

import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

/** Valida los JWT (HS256) emitidos por ms-usuarios. El rol viaja en el claim "rol" (ADMIN | CLIENTE | SERVICIO). */
@Configuration
public class SecurityConfig {

    private final SecretKey clave;

    public SecurityConfig(@Value("${app.jwt.secret}") String secreto) {
        this.clave = new SecretKeySpec(secreto.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withSecretKey(clave).macAlgorithm(MacAlgorithm.HS256).build();
    }

    @Bean
    SecurityFilterChain filtros(HttpSecurity http) throws Exception {
        JwtGrantedAuthoritiesConverter roles = new JwtGrantedAuthoritiesConverter();
        roles.setAuthoritiesClaimName("rol");
        roles.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter convertidor = new JwtAuthenticationConverter();
        convertidor.setJwtGrantedAuthoritiesConverter(roles);

        http.csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/health", "/api/productos/**", "/api/v1/productos/**",
                                "/api/ofertas/vigentes", "/api/v1/ofertas/vigentes",
                                "/api/ofertas/precio/**", "/api/v1/ofertas/precio/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/ofertas", "/api/v1/ofertas").hasAnyRole("ADMIN", "VENDEDOR")
                        .requestMatchers(HttpMethod.PUT, "/api/productos/*", "/api/v1/productos/*")
                        .hasAnyRole("ADMIN", "SERVICIO")
                        .anyRequest().hasRole("ADMIN"))
                .oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(convertidor)));
        return http.build();
    }
}

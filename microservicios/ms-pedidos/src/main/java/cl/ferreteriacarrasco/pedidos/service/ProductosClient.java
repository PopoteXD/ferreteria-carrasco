package cl.ferreteriacarrasco.pedidos.service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

/** Cliente de ms-productos. Si app.productos.url está vacío, el servicio de pedidos funciona sin él. */
@Component
public class ProductosClient {

    private static final ParameterizedTypeReference<Map<String, Object>> MAPA = new ParameterizedTypeReference<>() {
    };

    private final RestClient client;
    private final JwtEncoder encoder;

    public ProductosClient(@Value("${app.productos.url:}") String url, JwtEncoder encoder) {
        this.client = url == null || url.isBlank() ? null : RestClient.create(url.replaceAll("/+$", ""));
        this.encoder = encoder;
    }

    /** Token de corta vida con rol SERVICIO para que ms-pedidos pueda ajustar el stock en ms-productos. */
    private String tokenServicio() {
        Instant ahora = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("ferreteria-carrasco")
                .subject("ms-pedidos")
                .issuedAt(ahora)
                .expiresAt(ahora.plusSeconds(120))
                .claim("rol", "SERVICIO")
                .build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();
    }

    public boolean habilitado() {
        return client != null;
    }

    /** Devuelve el producto, o null si no existe. */
    public Map<String, Object> obtener(String codigo) {
        try {
            return client.get().uri("/api/productos/{codigo}", codigo).retrieve().body(MAPA);
        } catch (HttpClientErrorException.NotFound e) {
            return null;
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "No se pudo consultar ms-productos");
        }
    }

    /**
     * Precio a cobrar con la oferta vigente de ms-productos. Si el servicio de ofertas
     * no responde se cobra el precio base para no bloquear la compra.
     */
    public int precioFinal(String codigo, int precioBase) {
        try {
            Map<String, Object> r = client.get().uri("/api/ofertas/precio/{codigo}", codigo).retrieve().body(MAPA);
            if (r != null && r.get("precioFinal") instanceof Number n) {
                return Math.min(precioBase, n.intValue());
            }
        } catch (RestClientException e) {
            // sin ofertas disponibles: se usa el precio base
        }
        return precioBase;
    }

    public void ajustarStock(String codigo, int delta) {
        Map<String, Object> producto = obtener(codigo);
        if (producto == null) {
            return;
        }
        Map<String, Object> datos = new HashMap<>(producto);
        int stock = ((Number) datos.get("stock")).intValue() + delta;
        datos.put("stock", Math.max(0, stock));
        try {
            client.put().uri("/api/productos/{codigo}", codigo)
                    .header("Authorization", "Bearer " + tokenServicio()).body(datos).retrieve().toBodilessEntity();
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "No se pudo actualizar el stock");
        }
    }
}

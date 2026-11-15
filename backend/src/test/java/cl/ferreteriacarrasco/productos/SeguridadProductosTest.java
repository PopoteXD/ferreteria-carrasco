package cl.ferreteriacarrasco.productos;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class SeguridadProductosTest {

    @Autowired
    private MockMvc mockMvc;

    private static final String PRODUCTO = """
            {"codigo":"ZZ777","nombre":"Prueba","categoria":"plomeria","precio":1200,"stock":5,
             "stockCritico":1,"descripcion":"d","imagen":"/i.jpg"}
            """;

    @Test
    void lecturaDelCatalogoEsPublica() throws Exception {
        mockMvc.perform(get("/api/productos")).andExpect(status().isOk());
        mockMvc.perform(get("/api/ofertas/vigentes")).andExpect(status().isOk());
        mockMvc.perform(get("/api/health")).andExpect(status().isOk());
    }

    @Test
    void sinTokenNoSePuedeEscribirNiVerOfertasDeAdmin() throws Exception {
        mockMvc.perform(post("/api/productos").contentType(MediaType.APPLICATION_JSON).content(PRODUCTO))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/productos/HM001")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/ofertas")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CLIENTE")
    void clienteRecibe403AlEscribir() throws Exception {
        mockMvc.perform(post("/api/productos").contentType(MediaType.APPLICATION_JSON).content(PRODUCTO))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/productos/HM001").contentType(MediaType.APPLICATION_JSON).content(PRODUCTO))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/productos/HM001")).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/ofertas").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "SERVICIO")
    void servicioInternoPuedeActualizarStockPeroNoCrear() throws Exception {
        mockMvc.perform(post("/api/productos").contentType(MediaType.APPLICATION_JSON).content(PRODUCTO))
                .andExpect(status().isForbidden());
    }
}

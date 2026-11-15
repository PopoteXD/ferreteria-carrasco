package cl.ferreteriacarrasco.pagos;

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
class SeguridadPagosTest {

    @Autowired
    private MockMvc mockMvc;

    private static final String PAGO = "{\"pedidoId\":\"PED-1\",\"metodo\":\"Débito\",\"monto\":5000}";

    @Test
    void sinTokenNoSePuedePagarNiListar() throws Exception {
        mockMvc.perform(post("/api/pagos").contentType(MediaType.APPLICATION_JSON).content(PAGO))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/pagos")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CLIENTE")
    void clientePuedePagarPeroNoListarTodosLosPagos() throws Exception {
        mockMvc.perform(post("/api/pagos").contentType(MediaType.APPLICATION_JSON).content(PAGO))
                .andExpect(status().isCreated());
        mockMvc.perform(get("/api/pagos")).andExpect(status().isForbidden());
    }
}

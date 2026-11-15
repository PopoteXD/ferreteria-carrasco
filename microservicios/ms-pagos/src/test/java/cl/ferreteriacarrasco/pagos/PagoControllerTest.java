package cl.ferreteriacarrasco.pagos;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@WithMockUser(roles = "ADMIN")
class PagoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private static String pago(String pedido, String metodo, int monto) {
        return "{\"pedidoId\":\"" + pedido + "\",\"metodo\":\"" + metodo + "\",\"monto\":" + monto + "}";
    }

    @Test
    void apruebaDebitoYDejaPendienteLaTransferencia() throws Exception {
        mockMvc.perform(post("/api/pagos").contentType(MediaType.APPLICATION_JSON).content(pago("PED-1", "Débito", 5000)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("Aprobado"));
        mockMvc.perform(post("/api/pagos").contentType(MediaType.APPLICATION_JSON)
                        .content(pago("PED-2", "Transferencia", 5000)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("Pendiente"));
    }

    @Test
    void rechazaPagoDuplicadoYDatosInvalidos() throws Exception {
        mockMvc.perform(post("/api/pagos").contentType(MediaType.APPLICATION_JSON).content(pago("PED-3", "Crédito", 5000)))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/pagos").contentType(MediaType.APPLICATION_JSON).content(pago("PED-3", "Crédito", 5000)))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/pagos").contentType(MediaType.APPLICATION_JSON).content(pago("PED-4", "Cheque", 0)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.metodo").exists())
                .andExpect(jsonPath("$.errores.monto").exists());
    }
}

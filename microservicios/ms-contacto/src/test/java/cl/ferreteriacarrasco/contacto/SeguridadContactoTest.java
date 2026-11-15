package cl.ferreteriacarrasco.contacto;

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
class SeguridadContactoTest {

    @Autowired
    private MockMvc mockMvc;

    private static final String MENSAJE =
            "{\"nombre\":\"Ana\",\"correo\":\"ana@gmail.com\",\"asunto\":\"Consulta\",\"contenido\":\"Hola\"}";

    @Test
    void cualquieraPuedeEnviarUnMensaje() throws Exception {
        mockMvc.perform(post("/api/contacto").contentType(MediaType.APPLICATION_JSON).content(MENSAJE))
                .andExpect(status().isCreated());
    }

    @Test
    void sinTokenNoSePuedenLeerLosMensajes() throws Exception {
        mockMvc.perform(get("/api/contacto")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CLIENTE")
    void clienteRecibe403AlLeerOBorrarMensajes() throws Exception {
        mockMvc.perform(get("/api/contacto")).andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/contacto/1")).andExpect(status().isForbidden());
    }
}

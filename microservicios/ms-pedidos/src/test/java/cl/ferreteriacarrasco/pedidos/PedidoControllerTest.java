package cl.ferreteriacarrasco.pedidos;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PedidoControllerTest {

    private static final String PEDIDO = """
            {"cliente":{"nombre":"Ana Pérez","correo":"ana@gmail.com"},
             "lineas":[{"codigo":"HM001","nombre":"Martillo","precio":7990,"cantidad":2}]}
            """;

    @Autowired
    private MockMvc mockMvc;

    private static JwtRequestPostProcessor admin() {
        return jwt().jwt(j -> j.subject("luis.ferreteria373@gmail.com")).authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    private static JwtRequestPostProcessor cliente(String correo) {
        return jwt().jwt(j -> j.subject(correo)).authorities(new SimpleGrantedAuthority("ROLE_CLIENTE"));
    }

    private String crearPedido() throws Exception {
        String cuerpo = mockMvc.perform(post("/api/pedidos").contentType(MediaType.APPLICATION_JSON).content(PEDIDO).with(cliente("ana@gmail.com")))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(cuerpo, "$.id");
    }

    @Test
    void creaPedidoYCalculaTotalesEnElServidor() throws Exception {
        mockMvc.perform(post("/api/pedidos").contentType(MediaType.APPLICATION_JSON).content(PEDIDO)
                        .with(cliente("ana@gmail.com")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(org.hamcrest.Matchers.startsWith("PED-")))
                .andExpect(jsonPath("$.subtotal").value(15980))
                .andExpect(jsonPath("$.envio").value(4990))
                .andExpect(jsonPath("$.total").value(20970))
                .andExpect(jsonPath("$.estado").value("Pendiente"));
    }

    @Test
    void cambiaEstadoYFiltraPorCorreo() throws Exception {
        String id = crearPedido();

        mockMvc.perform(patch("/api/pedidos/" + id + "/estado").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"Enviado\"}").with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("Enviado"));

        mockMvc.perform(get("/api/pedidos").param("correo", "ana@gmail.com").with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id));
        mockMvc.perform(get("/api/pedidos").param("correo", "otro@gmail.com").with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void rechazaEstadoInvalidoYPedidoVacio() throws Exception {
        String id = crearPedido();
        mockMvc.perform(patch("/api/pedidos/" + id + "/estado").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"Inventado\"}").with(admin()))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/pedidos").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cliente\":{\"nombre\":\"A\",\"correo\":\"a@gmail.com\"},\"lineas\":[]}").with(admin()))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/pedidos/PED-9999").with(admin())).andExpect(status().isNotFound());
    }

    @Test
    void sinTokenDevuelve401() throws Exception {
        mockMvc.perform(get("/api/pedidos")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/pedidos").contentType(MediaType.APPLICATION_JSON).content(PEDIDO))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void clienteSoloVeYCreaSusPropiosPedidos() throws Exception {
        String id = crearPedido();
        mockMvc.perform(get("/api/pedidos").with(cliente("ana@gmail.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id));
        mockMvc.perform(get("/api/pedidos").param("correo", "ana@gmail.com").with(cliente("otra@gmail.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
        mockMvc.perform(get("/api/pedidos/" + id).with(cliente("otra@gmail.com")))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/pedidos").contentType(MediaType.APPLICATION_JSON).content(PEDIDO)
                        .with(cliente("otra@gmail.com")))
                .andExpect(status().isForbidden());
    }

    @Test
    void clienteNoPuedeCambiarEstadoNiVerElResumen() throws Exception {
        String id = crearPedido();
        mockMvc.perform(patch("/api/pedidos/" + id + "/estado").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"Enviado\"}").with(cliente("ana@gmail.com")))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/pedidos/resumen").with(cliente("ana@gmail.com")))
                .andExpect(status().isForbidden());
    }
}

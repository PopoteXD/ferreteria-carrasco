package cl.ferreteriacarrasco.productos;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
class OfertaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private String producto(String codigo, int precio) {
        return """
                {"codigo":"%s","nombre":"Producto %s","categoria":"plomeria",
                 "precio":%d,"stock":5,"stockCritico":1,"descripcion":"d","imagen":"/i.jpg"}
                """.formatted(codigo, codigo, precio);
    }

    private static final String OFERTA_20 = """
            {"nombre":"Semana plomera","tipo":"PORCENTAJE","valor":20,"alcance":"PRODUCTOS",
             "productos":["zo001"],"activa":true,"destacada":true}
            """;

    @Test
    void ofertaVigenteBajaElPrecioQueSeCobra() throws Exception {
        mockMvc.perform(post("/api/productos").contentType(MediaType.APPLICATION_JSON).content(producto("ZO001", 10000)))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/ofertas").contentType(MediaType.APPLICATION_JSON).content(OFERTA_20))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.productos[0]").value("ZO001"));

        mockMvc.perform(get("/api/ofertas/precio/ZO001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.precioBase").value(10000))
                .andExpect(jsonPath("$.precioFinal").value(8000));
        mockMvc.perform(get("/api/ofertas/vigentes")).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("Semana plomera"));
    }

    @Test
    void ofertaDesactivadaOVencidaNoAplica() throws Exception {
        mockMvc.perform(post("/api/productos").contentType(MediaType.APPLICATION_JSON).content(producto("ZO002", 5000)))
                .andExpect(status().isCreated());
        String respuesta = mockMvc.perform(post("/api/ofertas").contentType(MediaType.APPLICATION_JSON)
                        .content(OFERTA_20.replace("zo001", "ZO002")))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String id = respuesta.replaceAll("(?s).*\"id\":(\\d+).*", "$1");

        mockMvc.perform(patch("/api/ofertas/" + id + "/activa?valor=false")).andExpect(status().isOk())
                .andExpect(jsonPath("$.activa").value(false));
        mockMvc.perform(get("/api/ofertas/precio/ZO002")).andExpect(jsonPath("$.precioFinal").value(5000));

        mockMvc.perform(post("/api/ofertas").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nombre":"Vieja","tipo":"MONTO","valor":1000,"alcance":"TODOS",
                                 "inicio":"2020-01-01","fin":"2020-01-31","activa":true}
                                """))
                .andExpect(status().isCreated());
        mockMvc.perform(get("/api/ofertas/precio/ZO002")).andExpect(jsonPath("$.precioFinal").value(5000));
    }

    @Test
    void validaDatosDeLaOferta() throws Exception {
        mockMvc.perform(post("/api/ofertas").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"X\",\"tipo\":\"PORCENTAJE\",\"valor\":150,\"alcance\":\"TODOS\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/ofertas").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"X\",\"tipo\":\"MONTO\",\"valor\":10,\"alcance\":\"CATEGORIA\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/ofertas").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"X\",\"tipo\":\"MONTO\",\"valor\":10,\"alcance\":\"TODOS\","
                                + "\"inicio\":\"2026-05-10\",\"fin\":\"2026-05-01\"}"))
                .andExpect(status().isBadRequest());
    }
}

package cl.ferreteriacarrasco.productos;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
class ProductoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void listaProductosConCodigoYCamposDelFrontend() throws Exception {
        mockMvc.perform(get("/api/productos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].codigo").exists())
                .andExpect(jsonPath("$[0].stockCritico").exists());
    }

    @Test
    void permiteCrearActualizarYEliminarProducto() throws Exception {
        String producto = """
                {"codigo":"ZZ999","nombre":"Producto de prueba","categoria":"plomeria",
                 "precio":1200,"stock":5,"stockCritico":1,"descripcion":"Prueba REST","imagen":"/img/prueba.jpg"}
                """;

        mockMvc.perform(post("/api/productos").contentType(MediaType.APPLICATION_JSON).content(producto))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.codigo").value("ZZ999"));

        mockMvc.perform(put("/api/productos/ZZ999").contentType(MediaType.APPLICATION_JSON)
                        .content(producto.replace("Producto de prueba", "Producto actualizado")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Producto actualizado"));

        mockMvc.perform(delete("/api/productos/ZZ999")).andExpect(status().isNoContent());
        mockMvc.perform(get("/api/productos/ZZ999")).andExpect(status().isNotFound());
    }

    @Test
    void rechazaCodigoDuplicadoYDatosInvalidos() throws Exception {
        String producto = """
                {"codigo":"HM001","nombre":"Duplicado","categoria":"herramientas-manuales",
                 "precio":100,"stock":1,"stockCritico":0,"descripcion":"","imagen":"/img/a.jpg"}
                """;
        mockMvc.perform(post("/api/productos").contentType(MediaType.APPLICATION_JSON).content(producto))
                .andExpect(status().isConflict());

        String invalido = producto.replace("HM001", "ZZ998").replace("\"precio\":100", "\"precio\":-100");
        mockMvc.perform(post("/api/productos").contentType(MediaType.APPLICATION_JSON).content(invalido))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.precio").exists());
    }
}

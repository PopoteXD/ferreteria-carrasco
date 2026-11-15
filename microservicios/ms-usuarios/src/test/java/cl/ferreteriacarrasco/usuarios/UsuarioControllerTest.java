package cl.ferreteriacarrasco.usuarios;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class UsuarioControllerTest {

    private static final String NUEVO = """
            {"run":"123456785","nombre":"Ana","apellidos":"Pérez Soto","correo":"ana@gmail.com",
             "clave":"secreta1","region":"Region de Tarapaca","comuna":"Iquique","direccion":"Calle 1"}
            """;

    private static final String ADMIN_CORREO = "luis.ferreteria373@gmail.com";

    @Autowired
    private MockMvc mockMvc;

    private String login(String correo, String clave) throws Exception {
        return mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\":\"" + correo + "\",\"clave\":\"" + clave + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
    }

    private static String token(String sesion) {
        return sesion.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
    }

    private static String id(String sesion) {
        return sesion.replaceAll(".*\"usuario\":\\{\"id\":(\\d+).*", "$1");
    }

    private static String bearer(String sesion) {
        return "Bearer " + token(sesion);
    }

    private String registrarCliente() throws Exception {
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(NUEVO))
                .andExpect(status().isCreated());
        return login("ana@gmail.com", "secreta1");
    }

    @Test
    void registraClienteConTokenYSinDevolverLaClave() throws Exception {
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(NUEVO))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.usuario.tipoUsuario").value("Cliente"))
                .andExpect(jsonPath("$.usuario.clave").doesNotExist())
                .andExpect(jsonPath("$.usuario.claveHash").doesNotExist());
    }

    @Test
    void loginFuncionaConClaveCorrectaYFallaConIncorrecta() throws Exception {
        registrarCliente();
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\":\"ana@gmail.com\",\"clave\":\"mala\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rechazaCorreoDuplicadoYRunInvalido() throws Exception {
        registrarCliente();
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(NUEVO.replace("123456785", "222222222")))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(NUEVO.replace("123456785", "123456780").replace("ana@", "otra@")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void existeAdministradorInicialYUbicacionesSonPublicas() throws Exception {
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\":\"" + ADMIN_CORREO + "\",\"clave\":\"admin123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario.tipoUsuario").value("Administrador"));
        mockMvc.perform(get("/api/ubicaciones/regiones"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").exists());
    }

    @Test
    void sinTokenLosEndpointsProtegidosDevuelven401() throws Exception {
        mockMvc.perform(get("/api/usuarios")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/usuarios")
                        .header("Authorization", "Bearer token.invalido.firma"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void clienteRecibe403EnLasOperacionesDeAdministracion() throws Exception {
        String sesion = registrarCliente();
        String admin = id(login(ADMIN_CORREO, "admin123"));
        mockMvc.perform(get("/api/usuarios").header("Authorization", bearer(sesion))).andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/usuarios/" + id(sesion) + "/rol").header("Authorization", bearer(sesion))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"tipoUsuario\":\"Administrador\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/usuarios/" + admin).header("Authorization", bearer(sesion)))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/usuarios/" + admin).header("Authorization", bearer(sesion)))
                .andExpect(status().isForbidden());
    }

    @Test
    void clienteVeYEditaSoloSuPropioPerfil() throws Exception {
        String sesion = registrarCliente();
        mockMvc.perform(get("/api/usuarios/" + id(sesion)).header("Authorization", bearer(sesion)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correo").value("ana@gmail.com"));
        mockMvc.perform(put("/api/usuarios/" + id(sesion)).header("Authorization", bearer(sesion))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Ana María\",\"apellidos\":\"Pérez Soto\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Ana María"));
    }

    @Test
    void renuevaElTokenConUnTokenVigente() throws Exception {
        String sesion = registrarCliente();
        mockMvc.perform(post("/api/auth/refresh").header("Authorization", bearer(sesion)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
        mockMvc.perform(post("/api/auth/refresh")).andExpect(status().isUnauthorized());
    }

    @Test
    void adminHaceElCrudCompletoDeUsuarios() throws Exception {
        String admin = bearer(login(ADMIN_CORREO, "admin123"));
        String creado = mockMvc.perform(post("/api/usuarios").header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(NUEVO.replace("\"clave\"", "\"tipoUsuario\":\"Cliente\",\"clave\"")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.activo").value(true))
                .andReturn().getResponse().getContentAsString();
        String id = creado.replaceAll(".*\"id\":(\\d+).*", "$1");

        mockMvc.perform(get("/api/usuarios").header("Authorization", admin))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/usuarios/" + id).header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Ana Editada\",\"apellidos\":\"Pérez\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Ana Editada"));
        mockMvc.perform(patch("/api/usuarios/" + id + "/rol").header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"tipoUsuario\":\"Administrador\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipoUsuario").value("Administrador"));
        mockMvc.perform(patch("/api/usuarios/" + id + "/estado").header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"activo\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activo").value(false));
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\":\"ana@gmail.com\",\"clave\":\"secreta1\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/usuarios/" + id).header("Authorization", admin))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/usuarios/" + id).header("Authorization", admin))
                .andExpect(status().isNotFound());
    }

    @Test
    void propietarioNoPuedeCambiarDeRolNiEliminarseNiDesactivarse() throws Exception {
        String sesion = login(ADMIN_CORREO, "admin123");
        String id = id(sesion);
        String admin = bearer(sesion);
        mockMvc.perform(patch("/api/usuarios/" + id + "/rol").header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"tipoUsuario\":\"Cliente\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/usuarios/" + id + "/estado").header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"activo\":false}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/usuarios/" + id).header("Authorization", admin))
                .andExpect(status().isForbidden());
    }

    @Test
    void administradorPuedeCambiarSuRun() throws Exception {
        String sesion = login(ADMIN_CORREO, "admin123");
        mockMvc.perform(put("/api/usuarios/" + id(sesion)).header("Authorization", bearer(sesion))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Luis\",\"apellidos\":\"Carrasco\",\"run\":\"123456785\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.run").value("123456785"));
    }
}

package cl.ferreteriacarrasco.usuarios.service;

import cl.ferreteriacarrasco.usuarios.dto.LoginRequest;
import cl.ferreteriacarrasco.usuarios.dto.PerfilRequest;
import cl.ferreteriacarrasco.usuarios.dto.RegistroRequest;
import cl.ferreteriacarrasco.usuarios.dto.RolRequest;
import cl.ferreteriacarrasco.usuarios.dto.UsuarioAdminRequest;
import cl.ferreteriacarrasco.usuarios.model.Ubicaciones;
import cl.ferreteriacarrasco.usuarios.model.Usuario;
import cl.ferreteriacarrasco.usuarios.repository.UsuarioRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class UsuarioService {

    public static final String CLIENTE = "Cliente";
    public static final String ADMINISTRADOR = "Administrador";

    private final UsuarioRepository repository;
    private final BCryptPasswordEncoder encoder;

    private final String correoPropietario;

    public UsuarioService(UsuarioRepository repository, BCryptPasswordEncoder encoder,
                          @Value("${app.admin.correo:luis.ferreteria373@gmail.com}") String correoPropietario) {
        this.repository = repository;
        this.encoder = encoder;
        this.correoPropietario = correoPropietario.trim().toLowerCase();
    }

    public boolean esPropietario(Usuario u) {
        return u.getCorreo() != null && u.getCorreo().equalsIgnoreCase(correoPropietario);
    }

    private void protegerPropietario(Usuario u) {
        if (esPropietario(u)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La cuenta propietaria no se puede modificar ni eliminar");
        }
    }

    /** Deja al propietario como administrador; migra el administrador de ejemplo antiguo si existe. */
    public void asegurarPropietario(RegistroRequest datos) {
        if (repository.findByCorreoIgnoreCase(correoPropietario).isPresent()) {
            Usuario p = repository.findByCorreoIgnoreCase(correoPropietario).get();
            if (!ADMINISTRADOR.equals(p.getTipoUsuario())) {
                p.setTipoUsuario(ADMINISTRADOR);
                repository.save(p);
            }
            return;
        }
        Usuario antiguo = repository.findByCorreoIgnoreCase("admin@duoc.cl").orElse(null);
        if (antiguo != null && ADMINISTRADOR.equals(antiguo.getTipoUsuario())) {
            antiguo.setCorreo(correoPropietario);
            antiguo.setClaveHash(encoder.encode(datos.clave()));
            repository.save(antiguo);
        } else if (!repository.existsByRun(datos.run())) {
            crearAdministrador(datos);
        }
    }

    @Transactional(readOnly = true)
    public List<Usuario> listar() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Usuario obtener(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }

    /** El registro público siempre crea clientes; un administrador se crea con {@link #crearAdministrador}. */
    public Usuario registrar(RegistroRequest datos) {
        return crear(datos, CLIENTE);
    }

    public Usuario crearPorAdmin(UsuarioAdminRequest datos) {
        return crear(datos.aRegistro(), datos.tipoUsuario());
    }

    public Usuario cambiarEstado(Long id, boolean activo) {
        Usuario u = obtener(id);
        if (!activo) {
            protegerPropietario(u);
        }
        u.setActivo(activo);
        return repository.save(u);
    }

    public Usuario crearAdministrador(RegistroRequest datos) {
        return crear(datos, ADMINISTRADOR);
    }

    private Usuario crear(RegistroRequest datos, String tipo) {
        String run = datos.run().toUpperCase();
        if (!runValido(run)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El RUN no es válido");
        }
        validarUbicacion(datos.region(), datos.comuna());
        if (repository.existsByRun(run)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un usuario con ese RUN");
        }
        if (repository.existsByCorreoIgnoreCase(datos.correo())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un usuario con ese correo");
        }
        Usuario u = new Usuario();
        u.setRun(run);
        u.setNombre(datos.nombre().trim());
        u.setApellidos(datos.apellidos().trim());
        u.setCorreo(datos.correo().trim().toLowerCase());
        u.setClaveHash(encoder.encode(datos.clave()));
        u.setTipoUsuario(tipo);
        u.setRegion(datos.region());
        u.setComuna(datos.comuna());
        u.setDireccion(datos.direccion());
        return repository.save(u);
    }

    @Transactional(readOnly = true)
    public Usuario iniciarSesion(LoginRequest datos) {
        Usuario u = repository.findByCorreoIgnoreCase(datos.correo().trim()).orElse(null);
        if (u == null || !encoder.matches(datos.clave(), u.getClaveHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos");
        }
        if (!u.isActivo()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La cuenta está desactivada");
        }
        return u;
    }

    public Usuario actualizarPerfil(Long id, PerfilRequest datos) {
        Usuario u = obtener(id);
        validarUbicacion(datos.region(), datos.comuna());
        if (datos.run() != null && !datos.run().isBlank() && !datos.run().equalsIgnoreCase(u.getRun())) {
            if (!ADMINISTRADOR.equals(u.getTipoUsuario())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el administrador puede cambiar su RUN");
            }
            String run = datos.run().toUpperCase();
            if (!run.matches("\\d{7,8}[0-9K]") || !runValido(run)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El RUN no es válido");
            }
            if (repository.existsByRun(run)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un usuario con ese RUN");
            }
            u.setRun(run);
        }
        u.setNombre(datos.nombre().trim());
        u.setApellidos(datos.apellidos().trim());
        u.setRegion(datos.region());
        u.setComuna(datos.comuna());
        u.setDireccion(datos.direccion());
        if (datos.clave() != null && !datos.clave().isBlank()) {
            u.setClaveHash(encoder.encode(datos.clave()));
        }
        return repository.save(u);
    }

    public Usuario cambiarRol(Long id, RolRequest datos) {
        Usuario u = obtener(id);
        protegerPropietario(u);
        String rol = datos.tipoUsuario();
        if (rol.equals(u.getTipoUsuario())) {
            return u;
        }
        if (ADMINISTRADOR.equals(u.getTipoUsuario())
                && repository.findAll().stream().filter(x -> ADMINISTRADOR.equals(x.getTipoUsuario())).count() <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Debe existir al menos un administrador");
        }
        u.setTipoUsuario(rol);
        return repository.save(u);
    }

    public void eliminar(Long id) {
        Usuario u = obtener(id);
        protegerPropietario(u);
        if (ADMINISTRADOR.equals(u.getTipoUsuario())
                && repository.findAll().stream().filter(x -> ADMINISTRADOR.equals(x.getTipoUsuario())).count() <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede eliminar al único administrador");
        }
        repository.delete(u);
    }

    private void validarUbicacion(String region, String comuna) {
        if (region == null || region.isBlank()) {
            return;
        }
        List<String> comunas = Ubicaciones.REGIONES_COMUNAS.get(region);
        if (comunas == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La región no existe");
        }
        if (comuna != null && !comuna.isBlank() && !comunas.contains(comuna)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La comuna no pertenece a la región");
        }
    }

    static boolean runValido(String run) {
        String cuerpo = run.substring(0, run.length() - 1);
        char dv = run.charAt(run.length() - 1);
        int suma = 0;
        int multiplo = 2;
        for (int i = cuerpo.length() - 1; i >= 0; i--) {
            suma += Character.getNumericValue(cuerpo.charAt(i)) * multiplo;
            multiplo = multiplo == 7 ? 2 : multiplo + 1;
        }
        int resto = 11 - (suma % 11);
        char esperado = resto == 11 ? '0' : resto == 10 ? 'K' : (char) ('0' + resto);
        return dv == esperado;
    }
}

package cl.ferreteriacarrasco.usuarios.dto;

import cl.ferreteriacarrasco.usuarios.model.Usuario;

public record UsuarioRespuesta(Long id, String run, String nombre, String apellidos, String correo,
                               String tipoUsuario, String region, String comuna, String direccion, boolean activo) {

    public static UsuarioRespuesta de(Usuario u) {
        return new UsuarioRespuesta(u.getId(), u.getRun(), u.getNombre(), u.getApellidos(), u.getCorreo(),
                u.getTipoUsuario(), u.getRegion(), u.getComuna(), u.getDireccion(), u.isActivo());
    }
}

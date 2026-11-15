package cl.ferreteriacarrasco.usuarios.dto;

public record SesionRespuesta(String token, long expiraEn, UsuarioRespuesta usuario) {
}

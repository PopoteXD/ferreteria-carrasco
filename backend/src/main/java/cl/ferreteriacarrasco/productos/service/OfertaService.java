package cl.ferreteriacarrasco.productos.service;

import cl.ferreteriacarrasco.productos.model.Oferta;
import cl.ferreteriacarrasco.productos.model.Producto;
import cl.ferreteriacarrasco.productos.repository.OfertaRepository;
import cl.ferreteriacarrasco.productos.repository.ProductoRepository;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class OfertaService {

    private final OfertaRepository repository;
    private final ProductoRepository productos;

    public OfertaService(OfertaRepository repository, ProductoRepository productos) {
        this.repository = repository;
        this.productos = productos;
    }

    @Transactional(readOnly = true)
    public List<Oferta> listar() {
        return repository.findAllByOrderByIdDesc();
    }

    @Transactional(readOnly = true)
    public List<Oferta> vigentes() {
        LocalDate hoy = LocalDate.now();
        return repository.findAllByOrderByIdDesc().stream().filter(o -> o.vigente(hoy)).toList();
    }

    @Transactional(readOnly = true)
    public Oferta obtener(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Oferta no encontrada"));
    }

    public Oferta crear(Oferta datos) {
        Oferta oferta = new Oferta();
        copiar(datos, oferta);
        return repository.save(oferta);
    }

    public Oferta actualizar(Long id, Oferta datos) {
        Oferta oferta = obtener(id);
        copiar(datos, oferta);
        return repository.save(oferta);
    }

    public Oferta cambiarActiva(Long id, boolean activa) {
        Oferta oferta = obtener(id);
        oferta.setActiva(activa);
        return repository.save(oferta);
    }

    public void eliminar(Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Oferta no encontrada");
        }
        repository.deleteById(id);
    }

    /** Mejor precio vigente de un producto (la oferta más barata gana; no se acumulan). */
    @Transactional(readOnly = true)
    public Map<String, Object> precio(String codigo) {
        Producto producto = productos.findById(codigo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
        int base = producto.getPrecio();
        int mejor = base;
        Long ofertaId = null;
        LocalDate hoy = LocalDate.now();
        for (Oferta o : repository.findAllByOrderByIdDesc()) {
            if (o.vigente(hoy) && o.aplicaA(producto)) {
                int candidato = o.aplicarA(base);
                if (candidato < mejor) {
                    mejor = candidato;
                    ofertaId = o.getId();
                }
            }
        }
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("codigo", producto.getCodigo());
        r.put("precioBase", base);
        r.put("precioFinal", mejor);
        r.put("ofertaId", ofertaId);
        return r;
    }

    private void copiar(Oferta datos, Oferta destino) {
        if (datos.getInicio() != null && datos.getFin() != null && datos.getFin().isBefore(datos.getInicio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de término no puede ser anterior al inicio");
        }
        if (Oferta.PORCENTAJE.equals(datos.getTipo()) && datos.getValor() > 99) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El porcentaje debe estar entre 1 y 99");
        }
        Set<String> categorias = datos.getCategorias().stream().map(String::trim).filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(java.util.LinkedHashSet::new));
        Set<String> codigos = datos.getProductos().stream().map(s -> s.trim().toUpperCase(Locale.ROOT))
                .filter(s -> !s.isEmpty()).collect(Collectors.toCollection(java.util.LinkedHashSet::new));
        if (Oferta.CATEGORIA.equals(datos.getAlcance()) && categorias.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Elige al menos una categoría");
        }
        if (Oferta.PRODUCTOS.equals(datos.getAlcance()) && codigos.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Elige al menos un producto");
        }
        destino.setNombre(datos.getNombre().trim());
        destino.setDescripcion(datos.getDescripcion());
        destino.setEtiqueta(datos.getEtiqueta());
        destino.setColor(datos.getColor());
        destino.setTipo(datos.getTipo());
        destino.setValor(datos.getValor());
        destino.setAlcance(datos.getAlcance());
        destino.setCategorias(Oferta.CATEGORIA.equals(datos.getAlcance()) ? categorias : Set.of());
        destino.setProductos(Oferta.PRODUCTOS.equals(datos.getAlcance()) ? codigos : Set.of());
        destino.setInicio(datos.getInicio());
        destino.setFin(datos.getFin());
        destino.setActiva(datos.isActiva());
        destino.setDestacada(datos.isDestacada());
    }
}

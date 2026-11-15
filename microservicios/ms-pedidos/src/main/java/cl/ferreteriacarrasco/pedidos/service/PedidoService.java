package cl.ferreteriacarrasco.pedidos.service;

import cl.ferreteriacarrasco.pedidos.dto.PedidoRequest;
import cl.ferreteriacarrasco.pedidos.model.LineaPedido;
import cl.ferreteriacarrasco.pedidos.model.Pedido;
import cl.ferreteriacarrasco.pedidos.repository.PedidoRepository;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class PedidoService {

    public static final int ENVIO = 4990;
    public static final List<String> ESTADOS =
            List.of("Pendiente", "En preparación", "Enviado", "Entregado", "Cancelado");

    private final PedidoRepository repository;
    private final ProductosClient productos;

    public PedidoService(PedidoRepository repository, ProductosClient productos) {
        this.repository = repository;
        this.productos = productos;
    }

    @Transactional(readOnly = true)
    public List<Pedido> listar(String correo) {
        if (correo != null && !correo.isBlank()) {
            return repository.findByClienteCorreoIgnoreCaseOrderByIdDesc(correo.trim());
        }
        return repository.findAllByOrderByIdDesc();
    }

    @Transactional(readOnly = true)
    public Pedido obtener(String codigo) {
        return repository.findById(idDesdeCodigo(codigo))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));
    }

    public Pedido crear(PedidoRequest datos) {
        Pedido pedido = new Pedido();
        pedido.setFecha(LocalDateTime.now());
        pedido.setClienteNombre(datos.cliente().nombre().trim());
        pedido.setClienteCorreo(datos.cliente().correo().trim().toLowerCase());
        pedido.setEstado("Pendiente");

        int subtotal = 0;
        for (PedidoRequest.Linea l : datos.lineas()) {
            String nombre = l.nombre();
            Integer precio = l.precio();
            if (productos.habilitado()) {
                Map<String, Object> producto = productos.obtener(l.codigo());
                if (producto == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El producto " + l.codigo() + " no existe");
                }
                int stock = ((Number) producto.get("stock")).intValue();
                if (stock < l.cantidad()) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Stock insuficiente para " + l.codigo());
                }
                // El precio (con la oferta vigente) y el nombre salen del catálogo, no del navegador.
                precio = productos.precioFinal(l.codigo(), ((Number) producto.get("precio")).intValue());
                nombre = String.valueOf(producto.get("nombre"));
            } else if (precio == null || nombre == null || nombre.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cada línea necesita nombre y precio");
            }
            LineaPedido linea = new LineaPedido();
            linea.setCodigo(l.codigo());
            linea.setNombre(nombre);
            linea.setPrecio(precio);
            linea.setCantidad(l.cantidad());
            pedido.agregarLinea(linea);
            subtotal += precio * l.cantidad();
        }
        pedido.setSubtotal(subtotal);
        pedido.setEnvio(ENVIO);
        pedido.setTotal(subtotal + ENVIO);
        Pedido guardado = repository.save(pedido);

        if (productos.habilitado()) {
            guardado.getLineas().forEach(l -> productos.ajustarStock(l.getCodigo(), -l.getCantidad()));
        }
        return guardado;
    }

    public Pedido cambiarEstado(String codigo, String estado) {
        if (!ESTADOS.contains(estado)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado no válido");
        }
        Pedido pedido = obtener(codigo);
        String anterior = pedido.getEstado();
        if ("Cancelado".equals(anterior) && !"Cancelado".equals(estado)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Un pedido cancelado no se puede reactivar");
        }
        pedido.setEstado(estado);
        if ("Cancelado".equals(estado) && !"Cancelado".equals(anterior) && productos.habilitado()) {
            pedido.getLineas().forEach(l -> productos.ajustarStock(l.getCodigo(), l.getCantidad()));
        }
        return repository.save(pedido);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> resumen() {
        List<Pedido> todos = repository.findAll();
        List<Pedido> validos = todos.stream().filter(p -> !"Cancelado".equals(p.getEstado())).toList();
        long ventas = validos.stream().mapToLong(Pedido::getTotal).sum();
        Map<String, Integer> porEstado = new LinkedHashMap<>();
        ESTADOS.forEach(e -> porEstado.put(e, 0));
        todos.forEach(p -> porEstado.merge(p.getEstado(), 1, Integer::sum));
        Map<String, Integer> unidades = new LinkedHashMap<>();
        validos.forEach(p -> p.getLineas().forEach(l -> unidades.merge(l.getNombre(), l.getCantidad(), Integer::sum)));
        List<Map<String, Object>> masVendidos = unidades.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed()).limit(5)
                .map(e -> Map.<String, Object>of("nombre", e.getKey(), "unidades", e.getValue())).toList();

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("totalPedidos", todos.size());
        r.put("ventasTotales", ventas);
        r.put("ticketPromedio", validos.isEmpty() ? 0 : ventas / validos.size());
        r.put("pedidosPorEstado", porEstado);
        r.put("masVendidos", masVendidos);
        return r;
    }

    private Long idDesdeCodigo(String codigo) {
        try {
            String numero = codigo.toUpperCase().startsWith("PED-") ? codigo.substring(4) : codigo;
            return Long.parseLong(numero) - Pedido.OFFSET_NUMERO;
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado");
        }
    }
}

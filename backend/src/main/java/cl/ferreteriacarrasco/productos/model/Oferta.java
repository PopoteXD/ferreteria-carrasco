package cl.ferreteriacarrasco.productos.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Campaña de oferta. Aplica un descuento a todo el catálogo, a categorías completas
 * o a productos puntuales, dentro de un rango opcional de fechas.
 */
@Entity
@Table(name = "ofertas")
public class Oferta {

    public static final String PORCENTAJE = "PORCENTAJE";
    public static final String MONTO = "MONTO";
    public static final String PRECIO_FIJO = "PRECIO_FIJO";
    public static final String TODOS = "TODOS";
    public static final String CATEGORIA = "CATEGORIA";
    public static final String PRODUCTOS = "PRODUCTOS";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre de la oferta es obligatorio")
    @Size(max = 80, message = "El nombre no puede superar 80 caracteres")
    @Column(length = 80, nullable = false)
    private String nombre;

    @Size(max = 300, message = "La descripción no puede superar 300 caracteres")
    @Column(length = 300)
    private String descripcion;

    @Size(max = 30, message = "La etiqueta no puede superar 30 caracteres")
    @Column(length = 30)
    private String etiqueta;

    @Size(max = 9, message = "El color no es válido")
    @Column(length = 9)
    private String color;

    @NotBlank(message = "El tipo de descuento es obligatorio")
    @Pattern(regexp = "PORCENTAJE|MONTO|PRECIO_FIJO", message = "Tipo permitido: PORCENTAJE, MONTO o PRECIO_FIJO")
    @Column(length = 15, nullable = false)
    private String tipo;

    @NotNull(message = "El valor del descuento es obligatorio")
    @Min(value = 1, message = "El valor debe ser mayor a 0")
    @Column(nullable = false)
    private Integer valor;

    @NotBlank(message = "El alcance es obligatorio")
    @Pattern(regexp = "TODOS|CATEGORIA|PRODUCTOS", message = "Alcance permitido: TODOS, CATEGORIA o PRODUCTOS")
    @Column(length = 12, nullable = false)
    private String alcance;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "oferta_categorias", joinColumns = @JoinColumn(name = "oferta_id"))
    @Column(name = "categoria", length = 60)
    private Set<String> categorias = new LinkedHashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "oferta_productos", joinColumns = @JoinColumn(name = "oferta_id"))
    @Column(name = "codigo", length = 20)
    private Set<String> productos = new LinkedHashSet<>();

    private LocalDate inicio;
    private LocalDate fin;

    @Column(nullable = false)
    private boolean activa = true;

    @Column(nullable = false)
    private boolean destacada;

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public String getEtiqueta() { return etiqueta; }
    public void setEtiqueta(String etiqueta) { this.etiqueta = etiqueta; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public Integer getValor() { return valor; }
    public void setValor(Integer valor) { this.valor = valor; }
    public String getAlcance() { return alcance; }
    public void setAlcance(String alcance) { this.alcance = alcance; }
    public Set<String> getCategorias() { return categorias; }
    public void setCategorias(Set<String> categorias) {
        this.categorias = categorias == null ? new LinkedHashSet<>() : new LinkedHashSet<>(categorias);
    }
    public Set<String> getProductos() { return productos; }
    public void setProductos(Set<String> productos) {
        this.productos = productos == null ? new LinkedHashSet<>() : new LinkedHashSet<>(productos);
    }
    public LocalDate getInicio() { return inicio; }
    public void setInicio(LocalDate inicio) { this.inicio = inicio; }
    public LocalDate getFin() { return fin; }
    public void setFin(LocalDate fin) { this.fin = fin; }
    public boolean isActiva() { return activa; }
    public void setActiva(boolean activa) { this.activa = activa; }
    public boolean isDestacada() { return destacada; }
    public void setDestacada(boolean destacada) { this.destacada = destacada; }

    /** Vigente hoy: activa y dentro del rango de fechas (extremos incluidos). */
    public boolean vigente(LocalDate hoy) {
        return activa && (inicio == null || !hoy.isBefore(inicio)) && (fin == null || !hoy.isAfter(fin));
    }

    public boolean aplicaA(Producto p) {
        return switch (alcance) {
            case TODOS -> true;
            case CATEGORIA -> categorias.contains(p.getCategoria());
            case PRODUCTOS -> productos.contains(p.getCodigo());
            default -> false;
        };
    }

    /** Precio final de un precio base, siempre entero y nunca menor a 0. Misma regla que el frontend. */
    public int aplicarA(int precio) {
        int final_ = switch (tipo) {
            case PORCENTAJE -> precio - (precio * valor + 50) / 100;
            case MONTO -> precio - valor;
            case PRECIO_FIJO -> valor;
            default -> precio;
        };
        return Math.max(0, Math.min(final_, precio));
    }
}

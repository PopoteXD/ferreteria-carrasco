package cl.ferreteriacarrasco.pagos.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

/**
 * Pago SIMULADO. No almacena datos de tarjeta: para cobrar de verdad hay que integrar un proveedor externo
 * (Webpay, Mercado Pago, Stripe...) y nunca guardar números de tarjeta propios.
 */
@Entity
@Table(name = "pagos")
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 20, nullable = false)
    private String pedidoId;

    @Column(length = 20, nullable = false)
    private String metodo;

    @Column(nullable = false)
    private Integer monto;

    @Column(length = 20, nullable = false)
    private String estado;

    @Column(length = 30, nullable = false, unique = true)
    private String referencia;

    private LocalDateTime fecha;

    public Long getId() { return id; }
    public String getPedidoId() { return pedidoId; }
    public void setPedidoId(String pedidoId) { this.pedidoId = pedidoId; }
    public String getMetodo() { return metodo; }
    public void setMetodo(String metodo) { this.metodo = metodo; }
    public Integer getMonto() { return monto; }
    public void setMonto(Integer monto) { this.monto = monto; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia = referencia; }
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
}

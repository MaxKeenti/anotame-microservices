package com.anotame.sales.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "tco_order_item")
@Getter
@Setter
@SQLDelete(sql = "UPDATE tco_order_item SET is_deleted = true WHERE id_order_item = ?")
@SQLRestriction("is_deleted = false")
public class OrderItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_order_item")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_order", nullable = false)
    private OrderEntity order;

    @Column(name = "id_garment_type", nullable = false)
    private UUID garmentTypeId;

    @OneToMany(mappedBy = "orderItem", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<OrderItemServiceEntity> services = new java.util.ArrayList<>();

    @Column(name = "garment_name")
    private String garmentName;

    @Column(name = "quantity", nullable = false)
    private Integer quantity = 1;

    @Column(name = "unit_price", precision = 19, scale = 4)
    private BigDecimal unitPrice;

    @Column(name = "subtotal", precision = 19, scale = 4)
    private BigDecimal subtotal;

    private String notes;

    @Column(name = "is_deleted")
    private boolean deleted = false;
}

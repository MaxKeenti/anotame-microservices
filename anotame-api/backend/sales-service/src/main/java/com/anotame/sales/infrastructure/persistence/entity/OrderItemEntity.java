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

    @Column(name = "id_service", nullable = false)
    private UUID serviceId;

    @Column(name = "service_name")
    private String serviceName;

    @Column(name = "garment_name")
    private String garmentName;

    @Column(name = "unit_price", precision = 19, scale = 4)
    private BigDecimal unitPrice;

    private Integer quantity = 1;

    @Column(name = "subtotal", precision = 19, scale = 4)
    private BigDecimal subtotal;

    @Column(name = "adjustment_amount", precision = 19, scale = 4)
    private BigDecimal adjustmentAmount = BigDecimal.ZERO;

    @Column(name = "adjustment_reason")
    private String adjustmentReason;

    private String notes;

    @Column(name = "is_deleted")
    private boolean deleted = false;
}

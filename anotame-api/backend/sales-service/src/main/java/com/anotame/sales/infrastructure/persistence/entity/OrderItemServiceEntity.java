package com.anotame.sales.infrastructure.persistence.entity;

import com.anotame.sales.domain.model.OrderContentSource;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "tco_order_item_service")
@Getter
@Setter
public class OrderItemServiceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_item_service")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_order_item", nullable = false)
    private OrderItemEntity orderItem;

    @Column(name = "id_service")
    private UUID serviceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_source", nullable = false, length = 20)
    private OrderContentSource source = OrderContentSource.CATALOG;

    @Column(name = "service_name")
    private String serviceName;

    @Column(name = "unit_price", precision = 19, scale = 4)
    private BigDecimal unitPrice;

    @Column(name = "adjustment_amount", precision = 19, scale = 4)
    private BigDecimal adjustmentAmount = BigDecimal.ZERO;

    @Column(name = "adjustment_reason")
    private String adjustmentReason;

    @Column(name = "duration_min")
    private Integer durationMin;

    @Column(name = "instructions", columnDefinition = "TEXT")
    private String instructions;
}

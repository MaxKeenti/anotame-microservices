package com.anotame.operations.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "tco_work_order_item")
@Getter
@Setter
public class WorkOrderItemJpa {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_work_order_item")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_work_order", nullable = false)
    private WorkOrderJpa workOrder;

    @Column(name = "id_sales_order_item", nullable = false)
    private UUID salesOrderItemId;

    @Column(name = "service_name", nullable = false)
    private String serviceName;

    @Column(name = "current_stage", nullable = false)
    private String currentStage;

    @Column(name = "notes")
    private String notes;
}

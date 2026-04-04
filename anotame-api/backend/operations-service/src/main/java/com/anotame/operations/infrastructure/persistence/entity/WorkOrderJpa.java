package com.anotame.operations.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tco_work_order")
@Getter
@Setter
public class WorkOrderJpa {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_work_order")
    private UUID id;

    @Column(name = "id_order", nullable = false)
    private UUID salesOrderId;

    @Column(nullable = false)
    private String status;

    @OneToMany(mappedBy = "workOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WorkOrderItemJpa> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

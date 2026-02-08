package com.anotame.operations.infrastructure.persistence.repository;

import com.anotame.operations.infrastructure.persistence.entity.WorkOrderJpa;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class WorkOrderRepository implements PanacheRepositoryBase<WorkOrderJpa, UUID> {
    public Optional<WorkOrderJpa> findBySalesOrderId(UUID salesOrderId) {
        return find("salesOrderId", salesOrderId).firstResultOptional();
    }
}

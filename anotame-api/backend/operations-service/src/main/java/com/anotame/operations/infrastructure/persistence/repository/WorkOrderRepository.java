package com.anotame.operations.infrastructure.persistence.repository;

import com.anotame.operations.infrastructure.persistence.entity.WorkOrderJpa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrderJpa, UUID> {
    Optional<WorkOrderJpa> findBySalesOrderId(UUID salesOrderId);
}

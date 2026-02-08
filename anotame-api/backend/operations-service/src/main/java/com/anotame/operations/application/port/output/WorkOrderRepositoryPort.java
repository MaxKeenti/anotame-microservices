package com.anotame.operations.application.port.output;

import com.anotame.operations.domain.model.WorkOrder;
import java.util.Optional;
import java.util.UUID;

public interface WorkOrderRepositoryPort {
    WorkOrder save(WorkOrder workOrder);

    Optional<WorkOrder> findById(UUID id);

    Optional<WorkOrder> findBySalesOrderId(UUID salesOrderId);

    java.util.List<WorkOrder> findAll();

    void delete(UUID id);
}

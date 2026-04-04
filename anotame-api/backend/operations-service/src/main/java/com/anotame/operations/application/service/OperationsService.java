package com.anotame.operations.application.service;

import com.anotame.operations.application.port.output.WorkOrderRepositoryPort;
import com.anotame.operations.domain.model.WorkOrder;
import com.anotame.operations.domain.model.WorkOrderItem;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class OperationsService {

    private final WorkOrderRepositoryPort workOrderRepositoryPort;

    @Transactional
    public WorkOrder createWorkOrder(UUID salesOrderId, List<WorkOrderItem> items) {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setSalesOrderId(salesOrderId);
        workOrder.setStatus("PENDING");

        for (WorkOrderItem item : items) {
            item.setCurrentStage("WAITING");
            workOrder.addItem(item);
        }

        return workOrderRepositoryPort.save(workOrder);
    }

    public WorkOrder getWorkOrder(UUID id) {
        return workOrderRepositoryPort.findById(id)
                .orElseThrow(() -> new RuntimeException("WorkOrder not found with id: " + id));
    }

    @Transactional
    public WorkOrder updateStatus(UUID id, String status) {
        WorkOrder workOrder = getWorkOrder(id);
        workOrder.setStatus(status);
        workOrder.setUpdatedAt(LocalDateTime.now());
        return workOrderRepositoryPort.save(workOrder);
    }

    public List<WorkOrder> getAllWorkOrders() {
        return workOrderRepositoryPort.findAll();
    }

    public void deleteWorkOrder(UUID id) {
        workOrderRepositoryPort.delete(id);
    }
}

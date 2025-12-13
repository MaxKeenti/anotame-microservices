package com.anotame.operations.infrastructure.web.controller;

import com.anotame.operations.application.service.OperationsService;
import com.anotame.operations.domain.model.WorkOrder;
import com.anotame.operations.domain.model.WorkOrderItem;
import com.anotame.operations.infrastructure.web.dto.CreateWorkOrderRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/operations/work-orders")
@RequiredArgsConstructor
public class OperationsController {

    private final OperationsService operationsService;

    @PostMapping
    public ResponseEntity<WorkOrder> createWorkOrder(@RequestBody CreateWorkOrderRequest request) {
        List<WorkOrderItem> items = request.getItems().stream().map(dto -> {
            WorkOrderItem item = new WorkOrderItem();
            item.setSalesOrderItemId(dto.getSalesOrderItemId());
            item.setServiceName(dto.getServiceName());
            item.setNotes(dto.getNotes());
            return item;
        }).collect(Collectors.toList());

        WorkOrder createdOrder = operationsService.createWorkOrder(request.getSalesOrderId(), items);
        return new ResponseEntity<>(createdOrder, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkOrder> getWorkOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(operationsService.getWorkOrder(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<WorkOrder> updateStatus(@PathVariable UUID id, @RequestParam String status) {
        return ResponseEntity.ok(operationsService.updateStatus(id, status));
    }
}

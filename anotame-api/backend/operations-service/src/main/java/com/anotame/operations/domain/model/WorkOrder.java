package com.anotame.operations.domain.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class WorkOrder {
    private UUID id;
    private UUID salesOrderId;
    private String status; // PENDING, IN_PROGRESS, COMPLETED
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<WorkOrderItem> items = new ArrayList<>();

    public void addItem(WorkOrderItem item) {
        items.add(item);
    }
}

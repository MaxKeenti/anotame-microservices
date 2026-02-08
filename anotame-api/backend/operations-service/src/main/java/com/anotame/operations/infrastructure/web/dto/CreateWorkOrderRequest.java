package com.anotame.operations.infrastructure.web.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreateWorkOrderRequest {
    private UUID salesOrderId;
    private List<WorkOrderItemRequest> items;

    @Data
    public static class WorkOrderItemRequest {
        private UUID salesOrderItemId;
        private String serviceName;
        private String notes;
    }
}

package com.anotame.operations.domain.model;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class WorkOrderItem {
    private UUID id;
    private UUID salesOrderItemId;
    private String serviceName;
    private String currentStage; // WAITING, WASHING, IRONING, FINISHED
    private String notes;
}

package com.anotame.sales.application.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class OrderItemDto {
    private UUID garmentTypeId;
    private String garmentName;
    private java.util.List<OrderItemServiceDto> services;
    private Integer quantity;
    private String notes;
}

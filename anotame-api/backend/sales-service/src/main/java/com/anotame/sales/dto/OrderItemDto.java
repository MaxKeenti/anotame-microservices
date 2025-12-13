package com.anotame.sales.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class OrderItemDto {
    private UUID garmentTypeId;
    private String garmentName;
    private UUID serviceId;
    private String serviceName;
    private BigDecimal unitPrice;
    private Integer quantity;
    private String notes;
}

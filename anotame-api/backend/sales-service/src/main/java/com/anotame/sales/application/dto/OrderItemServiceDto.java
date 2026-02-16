package com.anotame.sales.application.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class OrderItemServiceDto {
    private UUID serviceId;
    private String serviceName;
    private BigDecimal unitPrice;
    private BigDecimal adjustmentAmount;
    private String adjustmentReason;
}

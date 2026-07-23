package com.anotame.sales.domain.model;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class OrderItemService {
    private UUID id;
    private UUID serviceId;
    private OrderContentSource source = OrderContentSource.CATALOG;
    private String serviceName;
    private BigDecimal unitPrice;
    private BigDecimal adjustmentAmount;
    private String adjustmentReason;
    private Integer durationMin;
    private String instructions;
}

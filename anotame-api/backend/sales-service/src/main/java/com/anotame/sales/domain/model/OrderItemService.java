package com.anotame.sales.domain.model;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class OrderItemService {
    private UUID id;
    private UUID serviceId;
    private String serviceName;
    private BigDecimal unitPrice;
    private BigDecimal adjustmentAmount;
    private String adjustmentReason;
}

package com.anotame.sales.domain.model;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class OrderItem {
    private UUID id;
    private Order order;
    private UUID garmentTypeId;
    private UUID serviceId;
    private String serviceName;
    private String garmentName;
    private BigDecimal unitPrice;
    private Integer quantity = 1;
    private BigDecimal subtotal;
    private String notes;
    private boolean deleted = false;
}

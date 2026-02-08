package com.anotame.sales.domain.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class OrderItem {
    private UUID id;
    @JsonIgnore
    private Order order;
    private UUID garmentTypeId;
    private UUID serviceId;
    private String serviceName;
    private String garmentName;
    private BigDecimal unitPrice;
    private Integer quantity = 1;
    private BigDecimal subtotal;
    private BigDecimal adjustmentAmount;
    private String adjustmentReason;
    private String notes;
    private boolean deleted = false;
}

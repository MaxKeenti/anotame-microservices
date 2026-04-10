package com.anotame.sales.application.dto;

import lombok.Data;
import java.time.OffsetDateTime;
import java.util.List;

@Data
public class UpdateOrderRequest {
    private CustomerDto customer;
    private List<OrderItemDto> items;
    private OffsetDateTime committedDeadline;
    private String notes;
    private java.math.BigDecimal amountPaid;
    private String paymentMethod;
}

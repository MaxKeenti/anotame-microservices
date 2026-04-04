package com.anotame.sales.application.dto;

import lombok.Data;
import java.time.OffsetDateTime;
import java.util.List;

@Data
public class CreateOrderRequest {
    @jakarta.validation.Valid
    private CustomerDto customer;
    @jakarta.validation.Valid
    private List<OrderItemDto> items;
    @jakarta.validation.constraints.FutureOrPresent(message = "La fecha de entrega debe ser hoy o en el futuro")
    private OffsetDateTime committedDeadline;
    private String notes;
    private java.math.BigDecimal amountPaid;
    private String paymentMethod;
}

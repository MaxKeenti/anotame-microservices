package com.anotame.sales.application.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateOrderRequest {
    private CustomerDto customer;
    private List<OrderItemDto> items;
    @jakarta.validation.constraints.FutureOrPresent(message = "La fecha de entrega debe ser hoy o en el futuro")
    private LocalDateTime committedDeadline;
    private String notes;
    private java.math.BigDecimal amountPaid;
    private String paymentMethod;
}

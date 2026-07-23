package com.anotame.sales.application.dto;

import lombok.Data;
import java.time.OffsetDateTime;
import java.util.List;

@Data
public class UpdateOrderRequest {
    private CustomerDto customer;
    @jakarta.validation.Valid
    private List<OrderItemDto> items;
    private OffsetDateTime committedDeadline;
    private String notes;
}

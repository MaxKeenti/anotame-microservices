package com.anotame.sales.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateOrderRequest {
    private CustomerDto customer;
    private List<OrderItemDto> items;
    private LocalDateTime committedDeadline;
    private String notes;
}

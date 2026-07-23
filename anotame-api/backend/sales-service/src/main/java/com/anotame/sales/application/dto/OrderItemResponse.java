package com.anotame.sales.application.dto;

import com.anotame.sales.domain.model.OrderContentSource;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class OrderItemResponse {
    private UUID id;
    private UUID garmentTypeId;
    private OrderContentSource source;
    private String garmentName;
    private java.util.List<OrderItemServiceDto> services;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private String notes;
}

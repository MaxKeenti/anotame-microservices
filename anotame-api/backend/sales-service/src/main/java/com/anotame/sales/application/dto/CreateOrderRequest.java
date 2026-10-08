package com.anotame.sales.application.dto;

import lombok.Data;
import java.time.OffsetDateTime;
import java.util.List;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Data
@Schema(requiredProperties = {"customer", "items"})
public class CreateOrderRequest {
    @jakarta.validation.Valid
    private CustomerDto customer;
    @jakarta.validation.Valid
    private List<OrderItemDto> items;
    @jakarta.validation.constraints.FutureOrPresent(message = "La fecha de entrega debe ser hoy o en el futuro")
    @Schema(nullable = true)
    private OffsetDateTime committedDeadline;
    @Schema(nullable = true)
    private String notes;
    @Schema(nullable = true)
    private java.math.BigDecimal amountPaid;
    @Schema(nullable = true)
    private String paymentMethod;
    @Schema(nullable = true)
    private java.util.UUID priceListId;
    @Schema(nullable = true)
    private String priceListName;
}

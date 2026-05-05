package com.anotame.sales.domain.model;

import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class OrderPayment {
    private UUID id;
    private UUID orderId;
    private BigDecimal amount;
    private String paymentMethod;
    private String notes;
    private OffsetDateTime recordedAt;
    private OffsetDateTime createdAt;
}

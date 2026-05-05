package com.anotame.sales.application.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record PaymentResponse(
        UUID id,
        UUID orderId,
        BigDecimal amount,
        String paymentMethod,
        String notes,
        OffsetDateTime recordedAt,
        BigDecimal orderAmountPaid,
        BigDecimal orderTotalAmount,
        BigDecimal orderBalance
) {}

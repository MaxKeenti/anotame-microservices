package com.anotame.sales.application.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

public record PaymentResponse(
        UUID id,
        UUID orderId,
        BigDecimal amount,
        @Schema(nullable = true)
        String paymentMethod,
        @Schema(nullable = true)
        String notes,
        OffsetDateTime recordedAt,
        BigDecimal orderAmountPaid,
        BigDecimal orderTotalAmount,
        BigDecimal orderBalance
) {}

package com.anotame.sales.application.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AddPaymentRequest(

        @NotNull(message = "amount is required")
        BigDecimal amount,

        String paymentMethod,

        String notes
) {}

package com.anotame.sales.application.port.output;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record OrderSummaryProjection(
        UUID id,
        String ticketNumber,
        UUID customerId,
        String customerFirstName,
        String customerLastName,
        String customerEmail,
        String customerPhoneNumber,
        OffsetDateTime committedDeadline,
        String status,
        BigDecimal totalAmount,
        BigDecimal amountPaid,
        Integer totalDurationMin,
        OffsetDateTime createdAt,
        OffsetDateTime deliveredAt,
        List<String> garmentNames,
        List<String> serviceNames) {
}

package com.anotame.sales.application.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Data
@Builder
public class OrderSummaryResponse {
    private UUID id;
    private String ticketNumber;
    private CustomerDto customer;
    @Schema(nullable = true)
    private OffsetDateTime committedDeadline;
    private String status;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    @Schema(nullable = true)
    private Integer totalDurationMin;
    @Schema(nullable = true)
    private OffsetDateTime createdAt;
    @Schema(nullable = true)
    private OffsetDateTime deliveredAt;
    private List<String> garmentNames;
    private List<String> serviceNames;
}

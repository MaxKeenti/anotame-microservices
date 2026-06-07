package com.anotame.sales.application.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class OrderSummaryResponse {
    private UUID id;
    private String ticketNumber;
    private CustomerDto customer;
    private OffsetDateTime committedDeadline;
    private String status;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private Integer totalDurationMin;
    private OffsetDateTime createdAt;
    private OffsetDateTime deliveredAt;
    private List<String> garmentNames;
    private List<String> serviceNames;
}

package com.anotame.sales.application.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

/** One ticket carrying an outstanding balance, for auditing the receivables total. */
@Data
@Builder
public class ReceivableOrderItem {
    private UUID id;
    private String ticketNumber;
    private UUID branchId;
    @Schema(nullable = true)
    private String customerName;
    private OffsetDateTime createdAt;
    @Schema(nullable = true)
    private OffsetDateTime committedDeadline;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private BigDecimal balance;
    private int daysOutstanding;
    private String status;
}

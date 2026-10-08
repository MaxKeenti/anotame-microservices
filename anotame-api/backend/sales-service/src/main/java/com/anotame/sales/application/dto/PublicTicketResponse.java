package com.anotame.sales.application.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Data
@Builder
public class PublicTicketResponse {
    private String ticketNumber;
    private String customerName;
    @Schema(nullable = true)
    private String phoneNumber;
    @Schema(nullable = true)
    private OffsetDateTime committedDeadline;
    private String status;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private BigDecimal balance;
    private List<PublicTicketItem> items;
    @Schema(nullable = true)
    private String pickupCode;
    @Schema(nullable = true)
    private OffsetDateTime createdAt;
    @Schema(nullable = true)
    private OffsetDateTime updatedAt;

    @Data
    @Builder
    public static class PublicTicketItem {
        private String garmentName;
        private Integer quantity;
        @Schema(nullable = true)
        private String notes;
        private List<PublicTicketService> services;
    }

    @Data
    @Builder
    public static class PublicTicketService {
        private String serviceName;
        private BigDecimal unitPrice;
        private BigDecimal adjustmentAmount;
        @Schema(nullable = true)
        private String adjustmentReason;
        @Schema(nullable = true)
        private String instructions;
    }
}

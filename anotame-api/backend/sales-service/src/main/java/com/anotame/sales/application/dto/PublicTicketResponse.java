package com.anotame.sales.application.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
public class PublicTicketResponse {
    private String ticketNumber;
    private String customerName;
    private String phoneNumber;
    private OffsetDateTime committedDeadline;
    private String status;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private BigDecimal balance;
    private List<PublicTicketItem> items;
    private String pickupCode;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @Data
    @Builder
    public static class PublicTicketItem {
        private String garmentName;
        private Integer quantity;
        private String notes;
        private List<PublicTicketService> services;
    }

    @Data
    @Builder
    public static class PublicTicketService {
        private String serviceName;
        private BigDecimal unitPrice;
        private BigDecimal adjustmentAmount;
        private String adjustmentReason;
        private String instructions;
    }
}

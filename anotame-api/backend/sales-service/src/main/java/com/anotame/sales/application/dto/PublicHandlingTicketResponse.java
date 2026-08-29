package com.anotame.sales.application.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * What someone holding a garment needs in order to return it to the right
 * order: whose it is, what was asked for, and when it is due. Deliberately
 * carries no pickup code and no amounts — a garment tag can leave the shop.
 */
@Data
@Builder
public class PublicHandlingTicketResponse {
    private String ticketNumber;
    private String customerName;
    private String phoneNumber;
    private OffsetDateTime committedDeadline;
    private String status;
    private List<PublicHandlingItem> items;

    @Data
    @Builder
    public static class PublicHandlingItem {
        private String garmentName;
        private Integer quantity;
        private String notes;
        private List<PublicHandlingService> services;
    }

    @Data
    @Builder
    public static class PublicHandlingService {
        private String serviceName;
        private String instructions;
    }
}

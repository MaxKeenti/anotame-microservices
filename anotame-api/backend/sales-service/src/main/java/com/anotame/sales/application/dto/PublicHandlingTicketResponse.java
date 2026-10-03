package com.anotame.sales.application.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

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
    @Schema(nullable = true)
    private String phoneNumber;
    @Schema(nullable = true)
    private OffsetDateTime committedDeadline;
    private String status;
    private List<PublicHandlingItem> items;

    @Data
    @Builder
    public static class PublicHandlingItem {
        private String garmentName;
        private Integer quantity;
        @Schema(nullable = true)
        private String notes;
        private List<PublicHandlingService> services;
    }

    @Data
    @Builder
    public static class PublicHandlingService {
        private String serviceName;
        @Schema(nullable = true)
        private String instructions;
    }
}

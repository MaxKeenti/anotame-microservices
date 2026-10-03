package com.anotame.sales.application.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Data
@Builder
public class AtRiskCustomerItem {
    private UUID customerId;
    private String firstName;
    private String lastName;
    @Schema(nullable = true)
    private String lastOrderDate;
    @Schema(nullable = true)
    private Long daysSinceLastOrder;
}

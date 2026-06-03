package com.anotame.sales.application.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class AtRiskCustomerItem {
    private UUID customerId;
    private String firstName;
    private String lastName;
    private String lastOrderDate;
    private Long daysSinceLastOrder;
}

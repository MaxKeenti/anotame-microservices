package com.anotame.sales.application.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class TopCustomerItem {
    private UUID customerId;
    private String firstName;
    private String lastName;
    private BigDecimal totalSpend;
    private long orderCount;
    private String lastOrderDate;
}

package com.anotame.sales.application.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class RevenueTrendPoint {
    private String period;
    private BigDecimal totalRevenue;
    private long paymentCount;
}

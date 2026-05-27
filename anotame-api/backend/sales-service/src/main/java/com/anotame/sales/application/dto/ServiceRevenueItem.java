package com.anotame.sales.application.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class ServiceRevenueItem {
    private String serviceName;
    private BigDecimal totalRevenue;
    private long orderCount;
    private long totalDurationMin;
    private BigDecimal revenuePerMinute;
    private BigDecimal percentShare;
}

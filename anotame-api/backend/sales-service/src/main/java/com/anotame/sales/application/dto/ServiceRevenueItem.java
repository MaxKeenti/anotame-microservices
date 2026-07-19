package com.anotame.sales.application.dto;

import com.anotame.sales.domain.model.OrderContentSource;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class ServiceRevenueItem {
    private OrderContentSource source;
    private String serviceName;
    private BigDecimal totalRevenue;
    private long orderCount;
    private long totalDurationMin;
    private BigDecimal revenuePerMinute;
    private BigDecimal percentShare;
}

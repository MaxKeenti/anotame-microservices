package com.anotame.sales.application.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class FinancialKpiResponse {
    private List<RevenueTrendPoint> revenueTrend;
    private List<ServiceRevenueItem> serviceBreakdown;
    private List<TopCustomerItem> topCustomers;
    private List<AtRiskCustomerItem> atRiskCustomers;

    private BigDecimal repeatRate;
    private long totalCustomersInPeriod;
    private long repeatCustomers;

}
package com.anotame.sales.application.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class DashboardMetricsResponse {
    
    @Data
    @Builder
    public static class WorkloadMetrics {
        private long todayDeliveries;
        private long comingDeliveries;
        private long pendingPipeline;
        private long readyForPickup;
        // Ratios for progress bars
        private long totalActive; // = pendingPipeline + readyForPickup
    }

    @Data
    @Builder
    public static class FinanceMetrics {
        private BigDecimal todayRevenue;
        private BigDecimal monthlyRevenue;
        private BigDecimal pendingDebt;
    }

    @Data
    @Builder
    public static class WeeklyChartPoint {
        private String date; // ISO Date YYYY-MM-DD
        private BigDecimal totalPaid;
    }

    private WorkloadMetrics workload;
    private FinanceMetrics finance;
    private List<WeeklyChartPoint> weeklyRevenueChart;
}

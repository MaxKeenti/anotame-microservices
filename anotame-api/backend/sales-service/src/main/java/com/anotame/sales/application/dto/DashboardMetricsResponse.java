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
        /** Cash actually received in the month, by payment date. */
        private BigDecimal monthlyRevenue;
        private List<PaymentMethodTotal> monthlyRevenueByPaymentMethod;
        /** Billed on tickets created in the month, excluding cancellations. */
        private BigDecimal monthlyBilled;
        /**
         * Collected against tickets created in the month, whenever the payment landed. Not comparable
         * to {@code monthlyRevenue}: a July ticket paid in August counts here in July, there in August.
         */
        private BigDecimal monthlyCollected;
        /** {@code monthlyBilled - monthlyCollected}: still owed on that month's tickets. */
        private BigDecimal monthlyPending;
        /** Owed on tickets still in the shop. */
        private BigDecimal openReceivable;
        /** Owed on garments already handed over. Tracked separately because the leverage is gone. */
        private BigDecimal deliveredUnpaid;
    }

    @Data
    @Builder
    public static class PaymentMethodTotal {
        private String paymentMethod;
        private BigDecimal total;
    }

    @Data
    @Builder
    public static class WeeklyChartPoint {
        private String date; // ISO Date YYYY-MM-DD
        private BigDecimal totalPaid;
    }

    @Data
    @Builder
    public static class WorkloadDayPoint {
        private String date; // ISO Date YYYY-MM-DD
        private long totalMinutesUsed;
    }

    private WorkloadMetrics workload;
    private FinanceMetrics finance;
    private List<WeeklyChartPoint> weeklyRevenueChart;
    private List<WorkloadDayPoint> dailyWorkload;
}

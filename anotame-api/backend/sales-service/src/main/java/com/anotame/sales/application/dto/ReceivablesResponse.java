package com.anotame.sales.application.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Breakdown behind the "Cuentas por Cobrar" figure.
 *
 * <p>The receivable is reported as two figures rather than one total. {@code openReceivable} is owed
 * on tickets still in the shop; {@code deliveredUnpaid} is owed on garments already handed over and
 * is materially riskier. Summing them is the caller's choice, not a default.
 */
@Data
@Builder
public class ReceivablesResponse {

    @Data
    @Builder
    public static class AgingBucket {
        /** One of {@code 0_30}, {@code 31_60}, {@code 61_90}, {@code 90_PLUS}. */
        private String bucket;
        private long orderCount;
        private BigDecimal balance;
    }

    @Data
    @Builder
    public static class StatusBreakdown {
        private String status;
        private long orderCount;
        private BigDecimal balance;
    }

    @Data
    @Builder
    public static class BranchBreakdown {
        private UUID branchId;
        private long orderCount;
        private BigDecimal balance;
    }

    private BigDecimal openReceivable;
    private BigDecimal deliveredUnpaid;
    private long openOrderCount;
    private long deliveredUnpaidOrderCount;
    private List<AgingBucket> aging;
    private List<StatusBreakdown> byStatus;
    private List<BranchBreakdown> byBranch;
    /** True when the denormalized {@code amount_paid} column agrees with the payment ledger. */
    private boolean ledgerReconciled;
    private BigDecimal ledgerDifference;
}

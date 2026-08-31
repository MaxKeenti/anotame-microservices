package com.anotame.sales.application.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ReceivableOrderPageResponse {
    private List<ReceivableOrderItem> items;
    private int page;
    private int size;
    private long total;
    private int totalPages;
    /** Sum of {@code balance} across the whole result set, not just the current page. */
    private BigDecimal totalBalance;
}

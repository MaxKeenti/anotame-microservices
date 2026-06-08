package com.anotame.sales.application.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class OrderSummaryPageResponse {
    private List<OrderSummaryResponse> items;
    private int page;
    private int size;
    private long total;
    private int totalPages;
}

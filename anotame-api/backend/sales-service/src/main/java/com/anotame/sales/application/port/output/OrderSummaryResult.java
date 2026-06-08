package com.anotame.sales.application.port.output;

import java.util.List;

public record OrderSummaryResult(List<OrderSummaryProjection> items, long total) {
}

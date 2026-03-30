package com.anotame.sales.application.port.output;

import com.anotame.sales.domain.model.Order;

public interface OrderRepositoryPort {
    Order save(Order order);

    java.util.List<Order> findAll();

    java.util.Optional<Order> findById(java.util.UUID id);

    void delete(java.util.UUID id);

    // KPI Metrics
    long countActiveByDeadlineRange(java.time.LocalDateTime start, java.time.LocalDateTime end);
    long countActiveFromDeadline(java.time.LocalDateTime start);
    long countByStatusNotIn(java.util.List<String> excludedStatuses);
    long countByStatus(String status);
    java.math.BigDecimal sumPaidAmountInRange(java.time.LocalDateTime start, java.time.LocalDateTime end);
    java.math.BigDecimal sumPendingDebt();
    java.util.List<Object[]> getWeeklyRevenueData(java.time.LocalDateTime start);
}

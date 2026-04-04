package com.anotame.sales.application.port.output;

import com.anotame.sales.domain.model.Order;

public interface OrderRepositoryPort {
    Order save(Order order);

    java.util.List<Order> findAll();

    java.util.Optional<Order> findById(java.util.UUID id);

    void delete(java.util.UUID id);

    /**
     * Returns the next ticket number from the PostgreSQL sequence
     * tco_ticket_number_seq.
     * Format: ORD-00001, ORD-00042, etc. (zero-padded to 5 digits).
     * This is the ONLY correct way to generate ticket numbers — do NOT use
     * System.currentTimeMillis() or UUID-based approaches, both of which collide.
     */
    String nextTicketNumber();

    // KPI Metrics
    long countActiveByDeadlineRange(java.time.OffsetDateTime start, java.time.OffsetDateTime end);

    long countActiveFromDeadline(java.time.OffsetDateTime start);

    long countByStatusNotIn(java.util.List<String> excludedStatuses);

    long countByStatus(String status);

    java.math.BigDecimal sumPaidAmountInRange(java.time.OffsetDateTime start, java.time.OffsetDateTime end);

    java.math.BigDecimal sumPendingDebt();

    java.util.List<Object[]> getWeeklyRevenueData(java.time.OffsetDateTime start);

    java.util.List<Object[]> getDailyWorkload(java.time.OffsetDateTime start, java.time.OffsetDateTime end);
}

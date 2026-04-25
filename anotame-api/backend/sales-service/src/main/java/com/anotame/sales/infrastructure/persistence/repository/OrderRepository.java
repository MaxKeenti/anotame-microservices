package com.anotame.sales.infrastructure.persistence.repository;

import com.anotame.sales.infrastructure.persistence.entity.OrderEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class OrderRepository implements PanacheRepositoryBase<OrderEntity, UUID> {

    // Workload
    public long countActiveByDeadlineRange(OffsetDateTime start, OffsetDateTime end) {
        return count("committedDeadline >= ?1 and committedDeadline < ?2 and status not in ('DELIVERED', 'CANCELLED')",
                start, end);
    }

    public long countActiveFromDeadline(OffsetDateTime start) {
        return count("committedDeadline >= ?1 and status not in ('DELIVERED', 'CANCELLED')", start);
    }

    public long countByStatusNotIn(List<String> excludedStatuses) {
        return count("status not in ?1", excludedStatuses);
    }

    public long countByStatus(String status) {
        return count("status = ?1", status);
    }

    // Finance
    @SuppressWarnings("null")
    public BigDecimal sumPaidAmountInRange(OffsetDateTime start, OffsetDateTime end) {
        return getEntityManager()
                .createQuery(
                        "SELECT SUM(o.amountPaid) FROM OrderEntity o WHERE o.createdAt >= :start AND o.createdAt < :end",
                        BigDecimal.class)
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultStream()
                .filter(java.util.Objects::nonNull)
                .findFirst()
                .orElse(BigDecimal.ZERO);
    }

    @SuppressWarnings("null")
    public BigDecimal sumPendingDebt() {
        // Pending debt calculated only for non-cancelled/non-delivered items
        return getEntityManager()
                .createQuery(
                        "SELECT SUM(o.totalAmount - o.amountPaid) FROM OrderEntity o WHERE o.status not in ('DELIVERED', 'CANCELLED') AND o.totalAmount > o.amountPaid",
                        BigDecimal.class)
                .getResultStream()
                .filter(java.util.Objects::nonNull)
                .findFirst()
                .orElse(BigDecimal.ZERO);
    }

    // Chart
    public List<Object[]> getWeeklyRevenueData(OffsetDateTime start) {
        return getEntityManager()
                .createQuery(
                        "SELECT CAST(o.createdAt AS date), SUM(o.amountPaid) FROM OrderEntity o WHERE o.createdAt >= :start GROUP BY CAST(o.createdAt AS date) ORDER BY CAST(o.createdAt AS date)",
                        Object[].class)
                .setParameter("start", start)
                .getResultList();
    }

    public List<Object[]> getDailyWorkload(OffsetDateTime start, OffsetDateTime end, String zoneId) {
        return getEntityManager()
                .createNativeQuery(
                        "SELECT (committed_deadline AT TIME ZONE :zone)::date AS day, SUM(total_duration_min) " +
                        "FROM tco_order " +
                        "WHERE committed_deadline >= :start AND committed_deadline < :end " +
                        "AND status NOT IN ('DELIVERED', 'CANCELLED') AND is_deleted = false " +
                        "GROUP BY day ORDER BY day")
                .setParameter("zone", zoneId)
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultList();
    }
}

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
    @SuppressWarnings("unchecked")
    public List<Object[]> getWeeklyRevenueData(OffsetDateTime start, String zoneId) {
        return getEntityManager()
                .createNativeQuery(
                        "SELECT (created_at AT TIME ZONE :zone)::date AS day, SUM(amount_paid) " +
                                "FROM tco_order " +
                                "WHERE created_at >= :start AND is_deleted = false " +
                                "GROUP BY day ORDER BY day")
                .setParameter("zone", zoneId)
                .setParameter("start", start)
                .getResultList();
    }

    @SuppressWarnings("unchecked")
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

    // Financial KPI Queries
    @SuppressWarnings("unchecked")
    public List<Object[]> getRevenueTimeSeries(OffsetDateTime start, String granularity, String zoneId) {
        String dateFormat = switch (granularity) {
            case "week" -> "IYYY-IW";  // ISO week-year and week
            case "month" -> "YYYY-MM";
            default -> "YYYY-MM-DD";   // day
        };

        return getEntityManager()
                .createNativeQuery(
                        "SELECT TO_CHAR((top.recorded_at AT TIME ZONE :zone), :dateFormat) AS period, " +
                                "SUM(top.amount) AS totalRevenue, COUNT(*) AS paymentCount " +
                                "FROM tco_order_payment top " +
                                "WHERE top.recorded_at >= :start AND top.amount > 0 " +
                                "GROUP BY period ORDER BY period")
                .setParameter("zone", zoneId)
                .setParameter("start", start)
                .setParameter("dateFormat", dateFormat)
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> getServiceTypeRevenue(OffsetDateTime start, OffsetDateTime end) {
        return getEntityManager()
                .createNativeQuery(
                        "SELECT " +
                        "  ois.service_name, " +
                        "  SUM(top.amount * (ois.unit_price / NULLIF(oi.subtotal, 0))) AS totalRevenue, " +
                        "  COUNT(DISTINCT top.id_order) AS orderCount, " +
                        "  COALESCE(SUM(ois.duration_min * oi.quantity), 0) AS totalDurationMin " +
                        "FROM tco_order_payment top " +
                        "JOIN tco_order o ON top.id_order = o.id_order " +
                        "JOIN tco_order_item oi ON o.id_order = oi.id_order " +
                        "JOIN tco_order_item_service ois ON oi.id_order_item = ois.id_order_item " +
                        "WHERE top.recorded_at >= :start AND top.recorded_at < :end " +
                        "  AND top.amount > 0 " +
                        "  AND o.is_deleted = false " +
                        "  AND oi.is_deleted = false " +
                        "GROUP BY ois.service_name " +
                        "ORDER BY totalRevenue DESC")
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultList();
    }

    public Object[] getRepeatRate(OffsetDateTime start, OffsetDateTime end) {
        return (Object[]) getEntityManager()
                .createNativeQuery(
                        "SELECT COUNT(DISTINCT id_customer) AS totalCustomers, " +
                        "COUNT(DISTINCT CASE WHEN cnt >= 2 THEN id_customer END) AS repeatCustomers " +
                        "FROM (SELECT id_customer, COUNT(*) AS cnt FROM tco_order WHERE created_at >= :start " +
                        "AND created_at < :end AND is_deleted = false GROUP BY id_customer) sub")
                .setParameter("start", start)
                .setParameter("end", end)
                .getSingleResult();
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> getTopCustomers(OffsetDateTime start, OffsetDateTime end, int limit) {
        return getEntityManager()
                .createNativeQuery(
                        "SELECT " +
                        "  c.id_customer, " +
                        "  c.first_name, " +
                        "  c.last_name, " +
                        "  SUM(top.amount) AS totalSpend, " +
                        "  COUNT(DISTINCT top.id_order) AS orderCount, " +
                        "  MAX((o.created_at AT TIME ZONE 'UTC')::date)::text AS lastOrderDate " +
                        "FROM tco_order_payment top " +
                        "JOIN tco_order o ON top.id_order = o.id_order " +
                        "JOIN tco_customer c ON o.id_customer = c.id_customer " +
                        "WHERE top.recorded_at >= :start AND top.recorded_at < :end " +
                        "  AND top.amount > 0 " +
                        "  AND o.is_deleted = false " +
                        "  AND c.is_deleted = false " +
                        "GROUP BY c.id_customer, c.first_name, c.last_name " +
                        "ORDER BY totalSpend DESC " +
                        "LIMIT :limit")
                .setParameter("start", start)
                .setParameter("end", end)
                .setParameter("limit", limit)
                .getResultList();
    }

    // At-Risk Customers
    @SuppressWarnings("unchecked")
    public List<Object[]> getAtRiskCustomers(OffsetDateTime cutoffDate, int limit) {
        return getEntityManager()
                .createNativeQuery(
                        "SELECT " +
                        "  c.id_customer, " +
                        "  c.first_name, " +
                        "  c.last_name, " +
                        "  MAX(o.created_at AT TIME ZONE 'UTC')::date::text AS last_order_date " +
                        "FROM tco_order o " +
                        "JOIN tco_customer c ON o.id_customer = c.id_customer " +
                        "WHERE o.is_deleted = false AND c.is_deleted = false " +
                        "GROUP BY c.id_customer, c.first_name, c.last_name " +
                        "HAVING MAX(o.created_at) < :cutoffDate " +
                        "ORDER BY last_order_date ASC " +
                        "LIMIT :limit")
                .setParameter("cutoffDate", cutoffDate)
                .setParameter("limit", limit)
                .getResultList();
    }

    // Calendar
    @SuppressWarnings("unchecked")
    public List<Object[]> getCalendarMonthData(OffsetDateTime monthStart, OffsetDateTime monthEnd, String zoneId) {
        return getEntityManager()
                .createNativeQuery(
                        "SELECT " +
                        "  (o.committed_deadline AT TIME ZONE :zone)::date AS date, " +
                        "  COALESCE(SUM(o.total_duration_min), 0) AS totalMinutesUsed, " +
                        "  COUNT(DISTINCT o.id_order) AS orderCount, " +
                        "  COALESCE(SUM(o.total_amount), 0) AS scheduledRevenue " +
                        "FROM tco_order o " +
                        "WHERE o.committed_deadline >= :start AND o.committed_deadline < :end " +
                        "  AND o.status NOT IN ('DELIVERED', 'CANCELLED') " +
                        "  AND o.is_deleted = false " +
                        "GROUP BY date " +
                        "ORDER BY date")
                .setParameter("zone", zoneId)
                .setParameter("start", monthStart)
                .setParameter("end", monthEnd)
                .getResultList();
    }
}

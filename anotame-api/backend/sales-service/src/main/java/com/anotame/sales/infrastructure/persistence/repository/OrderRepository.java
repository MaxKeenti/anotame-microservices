package com.anotame.sales.infrastructure.persistence.repository;

import com.anotame.sales.infrastructure.persistence.entity.OrderEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.time.LocalDate;
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
    public BigDecimal sumNetPaymentsInRange(OffsetDateTime start, OffsetDateTime end) {
        return getEntityManager()
                .createQuery(
                        "SELECT SUM(p.amount) FROM OrderPaymentEntity p " +
                                "WHERE p.recordedAt >= :start AND p.recordedAt < :end " +
                                // OrderEntity carries @SQLRestriction("is_deleted = false"), so this
                                // EXISTS filters out payments whose ticket was soft-deleted.
                                "AND EXISTS (SELECT 1 FROM OrderEntity o WHERE o.id = p.orderId)",
                        BigDecimal.class)
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultStream()
                .filter(java.util.Objects::nonNull)
                .findFirst()
                .orElse(BigDecimal.ZERO);
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> getNetPaymentTotalsByMethodInRange(OffsetDateTime start, OffsetDateTime end) {
        return getEntityManager()
                .createNativeQuery(
                        "SELECT CASE " +
                                "WHEN UPPER(BTRIM(p.payment_method)) IN ('CASH', 'CARD', 'TRANSFER') " +
                                "THEN UPPER(BTRIM(p.payment_method)) ELSE 'UNSPECIFIED' END AS method, " +
                                "SUM(p.amount) AS total " +
                                "FROM tco_order_payment p " +
                                "JOIN tco_order o ON o.id_order = p.id_order AND o.is_deleted = false " +
                                "WHERE p.recorded_at >= :start AND p.recorded_at < :end " +
                                "GROUP BY method ORDER BY method")
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultList();
    }

    /**
     * Receivable on tickets still in the shop: work is owed to the customer and money is owed to us.
     * This is the figure historically surfaced as "Cuentas por Cobrar".
     */
    @SuppressWarnings("null")
    public BigDecimal sumOpenReceivable() {
        return sumScalar(
                "SELECT SUM(o.totalAmount - o.amountPaid) FROM OrderEntity o " +
                        "WHERE o.status NOT IN ('DELIVERED', 'CANCELLED') AND o.totalAmount > o.amountPaid");
    }

    /**
     * Receivable on tickets already handed over. The garment is gone, so this is materially riskier
     * than {@link #sumOpenReceivable()} and is reported as its own figure rather than merged into it.
     */
    @SuppressWarnings("null")
    public BigDecimal sumDeliveredUnpaid() {
        return sumScalar(
                "SELECT SUM(o.totalAmount - o.amountPaid) FROM OrderEntity o " +
                        "WHERE o.status = 'DELIVERED' AND o.totalAmount > o.amountPaid");
    }

    /** Total billed on tickets created in the range, excluding cancellations. */
    @SuppressWarnings("null")
    public BigDecimal sumBilledInRange(OffsetDateTime start, OffsetDateTime end) {
        return getEntityManager()
                .createQuery(
                        "SELECT SUM(o.totalAmount) FROM OrderEntity o " +
                                "WHERE o.createdAt >= :start AND o.createdAt < :end " +
                                "AND o.status <> 'CANCELLED'",
                        BigDecimal.class)
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultStream()
                .filter(java.util.Objects::nonNull)
                .findFirst()
                .orElse(BigDecimal.ZERO);
    }

    /**
     * Collected against the cohort of tickets created in the range, regardless of when the payment
     * landed. Deliberately NOT comparable to {@link #sumNetPaymentsInRange} (cash-in by payment date):
     * a July ticket paid in August counts here in July and there in August.
     */
    @SuppressWarnings("null")
    public BigDecimal sumCollectedForCohort(OffsetDateTime start, OffsetDateTime end) {
        return getEntityManager()
                .createQuery(
                        "SELECT SUM(p.amount) FROM OrderPaymentEntity p, OrderEntity o " +
                                "WHERE o.id = p.orderId " +
                                "AND o.createdAt >= :start AND o.createdAt < :end " +
                                "AND o.status <> 'CANCELLED'",
                        BigDecimal.class)
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultStream()
                .filter(java.util.Objects::nonNull)
                .findFirst()
                .orElse(BigDecimal.ZERO);
    }

    /**
     * Aging breakdown of everything with an outstanding balance, bucketed by days since creation and
     * split by status and branch. Row shape: [bucket, status, branchId, orderCount, balance].
     */
    @SuppressWarnings("unchecked")
    public List<Object[]> getReceivablesAging(OffsetDateTime now) {
        return getEntityManager()
                .createNativeQuery(
                        "SELECT CASE " +
                        // CAST pins the bind type: Hibernate can otherwise send an untyped native
                        // parameter as bytea, and Postgres rejects "bytea - interval".
                        "    WHEN o.created_at > CAST(:now AS timestamptz) - INTERVAL '30 days' THEN '0_30' " +
                        "    WHEN o.created_at > CAST(:now AS timestamptz) - INTERVAL '60 days' THEN '31_60' " +
                        "    WHEN o.created_at > CAST(:now AS timestamptz) - INTERVAL '90 days' THEN '61_90' " +
                        "    ELSE '90_PLUS' END AS bucket, " +
                        "  o.status AS status, " +
                        "  o.id_branch AS branch_id, " +
                        "  COUNT(*) AS order_count, " +
                        "  SUM(o.total_amount - o.amount_paid) AS balance " +
                        "FROM tco_order o " +
                        "WHERE o.is_deleted = false " +
                        "  AND o.status <> 'CANCELLED' " +
                        "  AND o.total_amount > o.amount_paid " +
                        "GROUP BY bucket, o.status, o.id_branch " +
                        "ORDER BY bucket, o.status")
                .setParameter("now", now)
                .getResultList();
    }

    /**
     * Row-level detail behind the receivables figure, so the number can be audited.
     * Row shape: [id, ticketNumber, branchId, firstName, lastName, createdAt, committedDeadline,
     * totalAmount, amountPaid, balance, daysOutstanding, status].
     */
    @SuppressWarnings("unchecked")
    public List<Object[]> findReceivableOrders(OffsetDateTime now, boolean delivered, int offset, int limit) {
        return getEntityManager()
                .createNativeQuery(
                        "SELECT o.id_order, o.ticket_number, o.id_branch, c.first_name, c.last_name, " +
                        "  o.created_at, o.committed_deadline, o.total_amount, o.amount_paid, " +
                        "  (o.total_amount - o.amount_paid) AS balance, " +
                        "  FLOOR(EXTRACT(EPOCH FROM (CAST(:now AS timestamptz) - o.created_at)) / 86400)::int " +
                        "    AS days_outstanding, " +
                        "  o.status " +
                        "FROM tco_order o " +
                        "LEFT JOIN tco_customer c ON c.id_customer = o.id_customer " +
                        "WHERE o.is_deleted = false " +
                        "  AND o.total_amount > o.amount_paid " +
                        "  AND " + (delivered ? "o.status = 'DELIVERED' " : "o.status NOT IN ('DELIVERED', 'CANCELLED') ") +
                        "ORDER BY o.created_at ASC " +
                        "OFFSET :offset LIMIT :limit")
                .setParameter("now", now)
                .setParameter("offset", offset)
                .setParameter("limit", limit)
                .getResultList();
    }

    public long countReceivableOrders(boolean delivered) {
        String statusPredicate = delivered
                ? "status = 'DELIVERED'"
                : "status not in ('DELIVERED', 'CANCELLED')";
        return count(statusPredicate + " and totalAmount > amountPaid");
    }

    /**
     * Reconciliation guard: compares the denormalized {@code amount_paid} column against the payment
     * ledger. Row shape: [denormalizedTotal, ledgerTotal]. A mismatch means amountPaid has drifted.
     */
    public Object[] getPaymentReconciliation() {
        return (Object[]) getEntityManager()
                .createNativeQuery(
                        "SELECT COALESCE(SUM(o.amount_paid), 0) AS denormalized, " +
                        "  COALESCE((SELECT SUM(p.amount) FROM tco_order_payment p " +
                        "    JOIN tco_order po ON po.id_order = p.id_order AND po.is_deleted = false), 0) AS ledger " +
                        "FROM tco_order o WHERE o.is_deleted = false")
                .getSingleResult();
    }

    @SuppressWarnings("null")
    private BigDecimal sumScalar(String jpql) {
        return getEntityManager()
                .createQuery(jpql, BigDecimal.class)
                .getResultStream()
                .filter(java.util.Objects::nonNull)
                .findFirst()
                .orElse(BigDecimal.ZERO);
    }

    // Chart
    @SuppressWarnings("unchecked")
    public List<Object[]> getDailyNetPaymentData(OffsetDateTime start, OffsetDateTime end, String zoneId) {
        return getEntityManager()
                .createNativeQuery(
                        "SELECT (p.recorded_at AT TIME ZONE :zone)::date AS day, SUM(p.amount) " +
                                "FROM tco_order_payment p " +
                                "JOIN tco_order o ON o.id_order = p.id_order AND o.is_deleted = false " +
                                "WHERE p.recorded_at >= :start AND p.recorded_at < :end " +
                                "GROUP BY day ORDER BY day")
                .setParameter("zone", zoneId)
                .setParameter("start", start)
                .setParameter("end", end)
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
                                "JOIN tco_order o ON o.id_order = top.id_order AND o.is_deleted = false " +
                                "WHERE top.recorded_at >= :start " +
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
                        "  ois.service_source, " +
                        "  ois.service_name, " +
                        "  COALESCE(SUM(top.amount * " +
                        "    (((ois.unit_price + COALESCE(ois.adjustment_amount, 0)) * oi.quantity) " +
                        "      / NULLIF(o.total_amount, 0))), 0) AS totalRevenue, " +
                        "  COUNT(DISTINCT top.id_order) AS orderCount, " +
                        "  COALESCE(SUM(ois.duration_min * oi.quantity), 0) AS totalDurationMin " +
                        "FROM tco_order_payment top " +
                        "JOIN tco_order o ON top.id_order = o.id_order " +
                        "JOIN tco_order_item oi ON o.id_order = oi.id_order " +
                        "JOIN tco_order_item_service ois ON oi.id_order_item = ois.id_order_item " +
                        "WHERE top.recorded_at >= :start AND top.recorded_at < :end " +
                        "  AND o.is_deleted = false " +
                        "  AND oi.is_deleted = false " +
                        "  AND o.total_amount > 0 " +
                        "GROUP BY ois.service_source, ois.service_name " +
                        "ORDER BY totalRevenue DESC NULLS LAST, ois.service_name ASC")
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
    public List<Object[]> getAtRiskCustomers(LocalDate cutoffDate, String zoneId, int limit) {
        return getEntityManager()
                .createNativeQuery(
                        "SELECT " +
                        "  c.id_customer, " +
                        "  c.first_name, " +
                        "  c.last_name, " +
                        "  MAX((o.created_at AT TIME ZONE :zone)::date)::text AS last_order_date " +
                        "FROM tco_customer c " +
                        "LEFT JOIN tco_order o ON o.id_customer = c.id_customer " +
                        "  AND o.is_deleted = false " +
                        "WHERE c.is_deleted = false " +
                        "GROUP BY c.id_customer, c.first_name, c.last_name " +
                        "HAVING MAX((o.created_at AT TIME ZONE :zone)::date) <= :cutoffDate " +
                        "  OR (MAX((o.created_at AT TIME ZONE :zone)::date) IS NULL " +
                        "    AND MIN((c.created_at AT TIME ZONE :zone)::date) <= :cutoffDate) " +
                        "ORDER BY COALESCE(MAX((o.created_at AT TIME ZONE :zone)::date), " +
                        "  MIN((c.created_at AT TIME ZONE :zone)::date)) ASC, " +
                        "  c.first_name ASC, c.last_name ASC " +
                        "LIMIT :limit")
                .setParameter("zone", zoneId)
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

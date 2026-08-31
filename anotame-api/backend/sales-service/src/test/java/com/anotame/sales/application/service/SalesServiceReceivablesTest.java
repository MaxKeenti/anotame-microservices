package com.anotame.sales.application.service;

import com.anotame.sales.application.dto.ReceivableOrderPageResponse;
import com.anotame.sales.application.dto.ReceivablesResponse;
import com.anotame.sales.application.port.output.CustomerRepositoryPort;
import com.anotame.sales.application.port.output.OrderAuditLogRepositoryPort;
import com.anotame.sales.application.port.output.OrderPaymentRepositoryPort;
import com.anotame.sales.application.port.output.OrderRepositoryPort;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SalesServiceReceivablesTest {

    private static final ZoneId APP_ZONE = ZoneId.of("America/Mexico_City");
    private static final UUID BRANCH_A = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID BRANCH_B = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Test
    void receivablesSplitsOpenFromDeliveredAndFillsEveryAgingBucket() {
        SalesService service = serviceWith((method, args) -> switch (method.getName()) {
            // [bucket, status, branchId, orderCount, balance]
            case "getReceivablesAging" -> List.of(
                    new Object[] { "0_30", "RECEIVED", BRANCH_A, 3L, new BigDecimal("1500.00") },
                    new Object[] { "0_30", "READY", BRANCH_B, 2L, new BigDecimal("900.00") },
                    new Object[] { "90_PLUS", "RECEIVED", BRANCH_A, 1L, new BigDecimal("400.00") });
            case "sumOpenReceivable" -> new BigDecimal("2400.00");
            case "sumDeliveredUnpaid" -> new BigDecimal("400.00");
            case "countReceivableOrders" -> ((Boolean) args[0]) ? 1L : 5L;
            case "getPaymentReconciliation" ->
                    new Object[] { new BigDecimal("90000.00"), new BigDecimal("90000.00") };
            default -> null;
        });

        ReceivablesResponse response = service.getReceivables();

        // The two figures stay separate — nothing in the response merges them into one total.
        assertEquals(new BigDecimal("2400.00"), response.getOpenReceivable());
        assertEquals(new BigDecimal("400.00"), response.getDeliveredUnpaid());
        assertEquals(5L, response.getOpenOrderCount());
        assertEquals(1L, response.getDeliveredUnpaidOrderCount());

        assertEquals(List.of("0_30", "31_60", "61_90", "90_PLUS"),
                response.getAging().stream().map(ReceivablesResponse.AgingBucket::getBucket).toList());
        assertEquals(new BigDecimal("2400.00"), response.getAging().get(0).getBalance());
        assertEquals(5L, response.getAging().get(0).getOrderCount());
        assertEquals(BigDecimal.ZERO, response.getAging().get(1).getBalance());
        assertEquals(new BigDecimal("400.00"), response.getAging().get(3).getBalance());

        // Status and branch are aggregated over the same rows, ordered by balance descending.
        assertEquals(List.of("RECEIVED", "READY"),
                response.getByStatus().stream().map(ReceivablesResponse.StatusBreakdown::getStatus).toList());
        assertEquals(new BigDecimal("1900.00"), response.getByStatus().get(0).getBalance());
        assertEquals(List.of(BRANCH_A, BRANCH_B),
                response.getByBranch().stream().map(ReceivablesResponse.BranchBreakdown::getBranchId).toList());

        assertTrue(response.isLedgerReconciled());
        assertEquals(0, response.getLedgerDifference().compareTo(BigDecimal.ZERO));
    }

    @Test
    void reconciliationFlagsDriftBetweenAmountPaidAndLedger() {
        SalesService service = serviceWith((method, args) -> switch (method.getName()) {
            case "getReceivablesAging" -> List.of();
            case "sumOpenReceivable", "sumDeliveredUnpaid" -> BigDecimal.ZERO;
            case "getPaymentReconciliation" ->
                    new Object[] { new BigDecimal("90000.00"), new BigDecimal("89750.00") };
            default -> null;
        });

        ReceivablesResponse response = service.getReceivables();

        assertFalse(response.isLedgerReconciled());
        assertEquals(new BigDecimal("250.00"), response.getLedgerDifference());
    }

    @Test
    void receivableOrdersPageClampsSizeAndReportsWholeSetBalance() {
        int[] capturedOffsetAndLimit = new int[2];
        OffsetDateTime createdAt = OffsetDateTime.of(2026, 5, 1, 10, 0, 0, 0, java.time.ZoneOffset.UTC);

        SalesService service = serviceWith((method, args) -> switch (method.getName()) {
            case "countReceivableOrders" -> 42L;
            case "sumOpenReceivable" -> new BigDecimal("8800.00");
            case "findReceivableOrders" -> {
                capturedOffsetAndLimit[0] = (int) args[2];
                capturedOffsetAndLimit[1] = (int) args[3];
                // singletonList, not List.of: committedDeadline is deliberately null here.
                yield java.util.Collections.singletonList(new Object[] {
                        UUID.fromString("33333333-3333-3333-3333-333333333333"), "ORD-00042", BRANCH_A,
                        "Ana", "Ruiz", Timestamp.from(createdAt.toInstant()), null,
                        new BigDecimal("500.00"), new BigDecimal("200.00"), new BigDecimal("300.00"),
                        122, "RECEIVED"
                });
            }
            default -> null;
        });

        ReceivableOrderPageResponse page = service.getReceivableOrders(1, 500, false);

        // size is clamped to 100, and the offset follows the clamped size rather than the request.
        assertEquals(100, page.getSize());
        assertEquals(100, capturedOffsetAndLimit[0]);
        assertEquals(100, capturedOffsetAndLimit[1]);
        assertEquals(42L, page.getTotal());
        assertEquals(1, page.getTotalPages());
        // Balance covers the whole result set, not just this page.
        assertEquals(new BigDecimal("8800.00"), page.getTotalBalance());

        assertEquals("ORD-00042", page.getItems().get(0).getTicketNumber());
        assertEquals("Ana Ruiz", page.getItems().get(0).getCustomerName());
        assertEquals(createdAt, page.getItems().get(0).getCreatedAt());
        assertEquals(122, page.getItems().get(0).getDaysOutstanding());
        assertEquals(new BigDecimal("300.00"), page.getItems().get(0).getBalance());
    }

    private interface Stub {
        Object answer(java.lang.reflect.Method method, Object[] args);
    }

    private SalesService serviceWith(Stub stub) {
        OrderRepositoryPort orders = (OrderRepositoryPort) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[] { OrderRepositoryPort.class },
                (proxy, method, args) -> {
                    Object answer = stub.answer(method, args);
                    return answer != null ? answer : defaultValue(method.getReturnType());
                });

        SalesService service = new SalesService(
                orders,
                unusedPort(CustomerRepositoryPort.class),
                unusedPort(OrderAuditLogRepositoryPort.class),
                unusedPort(OrderPaymentRepositoryPort.class));
        service.appTimezone = APP_ZONE.getId();
        return service;
    }

    @SuppressWarnings("unchecked")
    private <T> T unusedPort(Class<T> portType) {
        return (T) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[] { portType },
                (proxy, method, args) -> defaultValue(method.getReturnType()));
    }

    private static Object defaultValue(Class<?> type) {
        if (type == boolean.class) return false;
        if (type == int.class) return 0;
        if (type == long.class) return 0L;
        if (List.class.isAssignableFrom(type)) return List.of();
        return null;
    }
}

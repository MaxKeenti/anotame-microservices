package com.anotame.sales.application.service;

import com.anotame.sales.application.dto.DashboardMetricsResponse;
import com.anotame.sales.application.port.output.CustomerRepositoryPort;
import com.anotame.sales.application.port.output.OrderAuditLogRepositoryPort;
import com.anotame.sales.application.port.output.OrderPaymentRepositoryPort;
import com.anotame.sales.application.port.output.OrderRepositoryPort;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SalesServiceDashboardMetricsTest {

    private static final ZoneId APP_ZONE = ZoneId.of("America/Mexico_City");

    @Test
    void dashboardRevenueUsesPaymentLedgerRanges() {
        List<OffsetDateTime[]> paymentRanges = new ArrayList<>();
        LocalDate today = LocalDate.now(APP_ZONE);

        OrderRepositoryPort orders = (OrderRepositoryPort) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[] { OrderRepositoryPort.class },
                (proxy, method, args) -> switch (method.getName()) {
                    case "sumNetPaymentsInRange" -> {
                        paymentRanges.add(new OffsetDateTime[] {
                                (OffsetDateTime) args[0], (OffsetDateTime) args[1]
                        });
                        yield paymentRanges.size() == 1
                                ? new BigDecimal("5020.00")
                                : new BigDecimal("84945.00");
                    }
                    case "getNetPaymentTotalsByMethodInRange" -> List.of(
                            new Object[] { "CASH", new BigDecimal("68540.00") },
                            new Object[] { "CARD", new BigDecimal("14300.00") },
                            new Object[] { "TRANSFER", new BigDecimal("2105.00") });
                    case "sumPendingDebt" -> new BigDecimal("20532.50");
                    case "getDailyNetPaymentData" -> Collections.singletonList(new Object[] {
                            Date.valueOf(today), new BigDecimal("5020.00")
                    });
                    case "getDailyWorkload" -> List.of();
                    default -> defaultValue(method.getReturnType());
                });

        SalesService service = new SalesService(
                orders,
                unusedPort(CustomerRepositoryPort.class),
                unusedPort(OrderAuditLogRepositoryPort.class),
                unusedPort(OrderPaymentRepositoryPort.class));
        service.appTimezone = APP_ZONE.getId();

        DashboardMetricsResponse metrics = service.getDashboardMetrics("2026-07");

        assertEquals(new BigDecimal("5020.00"), metrics.getFinance().getTodayRevenue());
        assertEquals(new BigDecimal("84945.00"), metrics.getFinance().getMonthlyRevenue());
        assertEquals(List.of("CASH", "CARD", "TRANSFER", "UNSPECIFIED"),
                metrics.getFinance().getMonthlyRevenueByPaymentMethod().stream()
                        .map(DashboardMetricsResponse.PaymentMethodTotal::getPaymentMethod)
                        .toList());
        assertEquals(List.of(
                        new BigDecimal("68540.00"),
                        new BigDecimal("14300.00"),
                        new BigDecimal("2105.00"),
                        BigDecimal.ZERO),
                metrics.getFinance().getMonthlyRevenueByPaymentMethod().stream()
                        .map(DashboardMetricsResponse.PaymentMethodTotal::getTotal)
                        .toList());
        assertEquals(metrics.getFinance().getMonthlyRevenue(),
                metrics.getFinance().getMonthlyRevenueByPaymentMethod().stream()
                        .map(DashboardMetricsResponse.PaymentMethodTotal::getTotal)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));
        assertEquals(new BigDecimal("20532.50"), metrics.getFinance().getPendingDebt());
        assertEquals(7, metrics.getWeeklyRevenueChart().size());
        assertEquals(today.toString(), metrics.getWeeklyRevenueChart().get(6).getDate());
        assertEquals(new BigDecimal("5020.00"), metrics.getWeeklyRevenueChart().get(6).getTotalPaid());

        assertEquals(2, paymentRanges.size());
        assertEquals(today.atStartOfDay(APP_ZONE).toOffsetDateTime(), paymentRanges.get(0)[0]);
        assertEquals(today.plusDays(1).atStartOfDay(APP_ZONE).toOffsetDateTime(), paymentRanges.get(0)[1]);
        assertEquals(YearMonth.of(2026, 7).atDay(1).atStartOfDay(APP_ZONE).toOffsetDateTime(),
                paymentRanges.get(1)[0]);
        assertEquals(YearMonth.of(2026, 8).atDay(1).atStartOfDay(APP_ZONE).toOffsetDateTime(),
                paymentRanges.get(1)[1]);
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
        if (type == byte.class) return (byte) 0;
        if (type == short.class) return (short) 0;
        if (type == int.class) return 0;
        if (type == long.class) return 0L;
        if (type == float.class) return 0F;
        if (type == double.class) return 0D;
        if (type == char.class) return '\0';
        if (List.class.isAssignableFrom(type)) return List.of();
        return null;
    }
}

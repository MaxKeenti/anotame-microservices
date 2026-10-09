package com.anotame.sales.application.service;

import com.anotame.sales.application.port.output.AuditLogEntry;
import com.anotame.sales.application.port.output.CustomerRepositoryPort;
import com.anotame.sales.application.port.output.OrderAuditLogRepositoryPort;
import com.anotame.sales.application.port.output.OrderPaymentRepositoryPort;
import com.anotame.sales.application.port.output.OrderRepositoryPort;
import com.anotame.sales.domain.exception.SalesConflictException;
import com.anotame.sales.domain.exception.SalesValidationException;
import com.anotame.sales.domain.model.Order;
import com.anotame.sales.domain.model.OrderPayment;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Delivery and cancellation: the two ways an order leaves the shop's open work. */
class SalesServiceOrderClosingTest {

    private static final String PICKUP_CODE = "123456";
    private static final UUID USER_ID = UUID.randomUUID();

    private final List<AuditLogEntry> auditEntries = new ArrayList<>();
    private final List<OrderPayment> payments = new ArrayList<>();
    private int orderSaves;

    @Test
    void deliversFromEveryOpenStatusAndAuditsTheStatusItLeft() {
        for (String status : List.of("RECEIVED", "IN_PROGRESS", "READY")) {
            auditEntries.clear();
            Order order = order(status);

            serviceFor(order).deliverOrder(order.getId(), PICKUP_CODE, USER_ID, false, null);

            assertEquals("DELIVERED", order.getStatus());
            assertNotNull(order.getDeliveredAt());
            assertEquals(1, auditEntries.size());
            assertEquals(status, auditEntries.get(0).oldValue());
            assertEquals("DELIVERED", auditEntries.get(0).newValue());
        }
    }

    @Test
    void refusesToDeliverAnOrderThatIsAlreadyClosed() {
        for (String status : List.of("DELIVERED", "CANCELLED")) {
            Order order = order(status);

            assertThrows(SalesConflictException.class,
                    () -> serviceFor(order).deliverOrder(order.getId(), PICKUP_CODE, USER_ID, false, null));
            assertEquals(status, order.getStatus());
        }
        assertTrue(auditEntries.isEmpty());
    }

    @Test
    void aWrongPickupCodeBlocksDeliveryFromReceived() {
        Order order = order("RECEIVED");

        assertThrows(SalesValidationException.class,
                () -> serviceFor(order).deliverOrder(order.getId(), "654321", USER_ID, false, null));

        assertEquals("RECEIVED", order.getStatus());
        assertNull(order.getDeliveredAt());
        assertTrue(auditEntries.isEmpty());
    }

    @Test
    void settlesTheBalanceWhenDeliveringStraightFromReceived() {
        Order order = order("RECEIVED");
        order.setTotalAmount(new BigDecimal("200.00"));
        order.setAmountPaid(new BigDecimal("50.00"));

        serviceFor(order).deliverOrder(order.getId(), PICKUP_CODE, USER_ID, true, "CARD");

        assertEquals("DELIVERED", order.getStatus());
        assertEquals(0, new BigDecimal("200.00").compareTo(order.getAmountPaid()));
        assertEquals(1, payments.size());
        assertEquals(0, new BigDecimal("150.00").compareTo(payments.get(0).getAmount()));
        assertEquals("CARD", payments.get(0).getPaymentMethod());
    }

    @Test
    void cancellingKeepsTheOrderOnRecordAndAuditsIt() {
        Order order = order("IN_PROGRESS");
        order.setAmountPaid(new BigDecimal("50.00"));

        serviceFor(order).cancelOrder(order.getId(), USER_ID);

        assertEquals("CANCELLED", order.getStatus());
        assertEquals(1, orderSaves);
        assertEquals(1, auditEntries.size());
        assertEquals("status", auditEntries.get(0).fieldName());
        assertEquals("IN_PROGRESS", auditEntries.get(0).oldValue());
        assertEquals("CANCELLED", auditEntries.get(0).newValue());
        assertEquals(USER_ID, auditEntries.get(0).userId());
        // The deposit stays on the ledger until it is refunded.
        assertEquals(0, new BigDecimal("50.00").compareTo(order.getAmountPaid()));
        assertTrue(payments.isEmpty());
    }

    @Test
    void cancellingAnAlreadyCancelledOrderChangesNothing() {
        Order order = order("CANCELLED");

        serviceFor(order).cancelOrder(order.getId(), USER_ID);

        assertEquals(0, orderSaves);
        assertTrue(auditEntries.isEmpty());
    }

    @Test
    void refusesToCancelADeliveredOrder() {
        Order order = order("DELIVERED");

        assertThrows(SalesConflictException.class,
                () -> serviceFor(order).cancelOrder(order.getId(), USER_ID));

        assertEquals("DELIVERED", order.getStatus());
        assertTrue(auditEntries.isEmpty());
    }

    private Order order(String status) {
        Order order = new Order();
        order.setId(UUID.randomUUID());
        order.setStatus(status);
        order.setPickupCode(PICKUP_CODE);
        return order;
    }

    private SalesService serviceFor(Order order) {
        OrderRepositoryPort orders = port(OrderRepositoryPort.class, (name, args) -> switch (name) {
            case "findById" -> Optional.of(order);
            case "save" -> {
                orderSaves++;
                yield args[0];
            }
            default -> null;
        });
        OrderAuditLogRepositoryPort audit = port(OrderAuditLogRepositoryPort.class, (name, args) -> {
            if (name.equals("save")) {
                auditEntries.add((AuditLogEntry) args[0]);
            }
            return null;
        });
        OrderPaymentRepositoryPort paymentPort = port(OrderPaymentRepositoryPort.class, (name, args) -> switch (name) {
            case "sumByOrderId" -> order.getAmountPaid();
            case "save" -> {
                payments.add((OrderPayment) args[0]);
                yield args[0];
            }
            default -> null;
        });
        return new SalesService(orders, port(CustomerRepositoryPort.class, (name, args) -> null), audit, paymentPort);
    }

    private interface Handler {
        Object handle(String methodName, Object[] args);
    }

    @SuppressWarnings("unchecked")
    private <T> T port(Class<T> portType, Handler handler) {
        return (T) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[] { portType },
                (proxy, method, args) -> handler.handle(method.getName(), args));
    }
}

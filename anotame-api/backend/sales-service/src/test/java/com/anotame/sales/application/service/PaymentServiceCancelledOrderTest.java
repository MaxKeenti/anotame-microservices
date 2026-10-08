package com.anotame.sales.application.service;

import com.anotame.sales.application.dto.AddPaymentRequest;
import com.anotame.sales.application.dto.PaymentResponse;
import com.anotame.sales.application.port.output.OrderPaymentRepositoryPort;
import com.anotame.sales.application.port.output.OrderRepositoryPort;
import com.anotame.sales.domain.exception.SalesUnprocessableException;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** A cancelled order takes no more money, but its deposit can be returned. */
class PaymentServiceCancelledOrderTest {

    private final List<OrderPayment> ledger = new ArrayList<>();

    @Test
    void aCancelledOrderRejectsNewPayments() {
        Order order = order("CANCELLED", "200.00", "50.00");

        assertThrows(SalesUnprocessableException.class,
                () -> serviceFor(order).addPayment(order.getId(), payment("20.00", null)));
        assertTrue(ledger.isEmpty());
    }

    @Test
    void aCancelledOrderAcceptsARefundOfItsDeposit() {
        Order order = order("CANCELLED", "200.00", "50.00");

        PaymentResponse response = serviceFor(order)
                .addPayment(order.getId(), payment("-50.00", "Pedido cancelado"));

        assertNotNull(response);
        assertEquals(1, ledger.size());
        assertEquals(0, BigDecimal.ZERO.compareTo(order.getAmountPaid()));
    }

    @Test
    void aRefundCannotExceedWhatWasPaid() {
        for (String status : List.of("CANCELLED", "RECEIVED")) {
            Order order = order(status, "200.00", "50.00");

            SalesUnprocessableException error = assertThrows(SalesUnprocessableException.class,
                    () -> serviceFor(order).addPayment(order.getId(), payment("-50.01", "Devolución")));

            assertEquals("REFUND_EXCEEDS_PAID", error.getMessage());
        }
        assertTrue(ledger.isEmpty());
    }

    private Order order(String status, String total, String paid) {
        Order order = new Order();
        order.setId(UUID.randomUUID());
        order.setStatus(status);
        order.setTotalAmount(new BigDecimal(total));
        order.setAmountPaid(new BigDecimal(paid));
        return order;
    }

    private AddPaymentRequest payment(String amount, String notes) {
        return new AddPaymentRequest(new BigDecimal(amount), "CASH", notes);
    }

    private PaymentService serviceFor(Order order) {
        BigDecimal paidBefore = order.getAmountPaid();
        OrderRepositoryPort orders = (OrderRepositoryPort) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[] { OrderRepositoryPort.class },
                (proxy, method, args) -> switch (method.getName()) {
                    case "findById" -> Optional.of(order);
                    case "save" -> args[0];
                    default -> null;
                });
        OrderPaymentRepositoryPort payments = (OrderPaymentRepositoryPort) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[] { OrderPaymentRepositoryPort.class },
                (proxy, method, args) -> switch (method.getName()) {
                    case "save" -> {
                        ledger.add((OrderPayment) args[0]);
                        yield args[0];
                    }
                    case "sumByOrderId" -> ledger.stream()
                            .map(OrderPayment::getAmount)
                            .reduce(paidBefore, BigDecimal::add);
                    default -> null;
                });
        return new PaymentService(orders, payments);
    }
}

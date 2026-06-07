package com.anotame.sales.application.service;

import com.anotame.sales.application.dto.AddPaymentRequest;
import com.anotame.sales.application.dto.PaymentResponse;
import com.anotame.sales.application.port.output.OrderPaymentRepositoryPort;
import com.anotame.sales.application.port.output.OrderRepositoryPort;
import com.anotame.sales.domain.exception.SalesNotFoundException;
import com.anotame.sales.domain.exception.SalesUnprocessableException;
import com.anotame.sales.domain.model.Order;
import com.anotame.sales.domain.model.OrderPayment;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class PaymentService {

    private final OrderRepositoryPort orderRepository;
    private final OrderPaymentRepositoryPort paymentRepository;

    @Transactional
    public PaymentResponse addPayment(UUID orderId, AddPaymentRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new SalesNotFoundException("Order not found: " + orderId));

        if ("CANCELLED".equals(order.getStatus())) {
            throw new SalesUnprocessableException("Cannot record payment for a cancelled order");
        }

        if (request.amount().compareTo(BigDecimal.ZERO) < 0
                && (request.notes() == null || request.notes().isBlank())) {
            throw new SalesUnprocessableException("REFUND_NOTE_REQUIRED");
        }

        BigDecimal newTotal = order.getAmountPaid().add(request.amount());
        if (newTotal.compareTo(order.getTotalAmount()) > 0) {
            throw new SalesUnprocessableException("Payment would exceed order total. Balance remaining: "
                    + order.getTotalAmount().subtract(order.getAmountPaid()));
        }

        OffsetDateTime now = OffsetDateTime.now();
        OrderPayment payment = new OrderPayment();
        payment.setOrderId(orderId);
        payment.setAmount(request.amount());
        payment.setPaymentMethod(request.paymentMethod());
        payment.setNotes(request.notes());
        payment.setRecordedAt(now);
        payment.setCreatedAt(now);

        OrderPayment saved = paymentRepository.save(payment);

        // Recompute amountPaid from ledger within the same transaction
        BigDecimal amountPaid = paymentRepository.sumByOrderId(orderId);
        order.setAmountPaid(amountPaid);
        order.setUpdatedAt(now);
        orderRepository.save(order);

        BigDecimal balance = order.getTotalAmount().subtract(amountPaid);
        return toResponse(saved, amountPaid, order.getTotalAmount(), balance);
    }

    public List<PaymentResponse> getPayments(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new SalesNotFoundException("Order not found: " + orderId));
        BigDecimal amountPaid = paymentRepository.sumByOrderId(orderId);

        return paymentRepository.findByOrderId(orderId).stream()
                .map(p -> toResponse(p, amountPaid, order.getTotalAmount(),
                        order.getTotalAmount().subtract(amountPaid)))
                .toList();
    }

    private PaymentResponse toResponse(OrderPayment payment, BigDecimal amountPaid,
                                       BigDecimal totalAmount, BigDecimal balance) {
        return new PaymentResponse(
                payment.getId(),
                payment.getOrderId(),
                payment.getAmount(),
                payment.getPaymentMethod(),
                payment.getNotes(),
                payment.getRecordedAt(),
                amountPaid,
                totalAmount,
                balance
        );
    }
}

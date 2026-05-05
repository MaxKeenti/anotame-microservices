package com.anotame.sales.application.port.output;

import com.anotame.sales.domain.model.OrderPayment;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface OrderPaymentRepositoryPort {

    OrderPayment save(OrderPayment payment);

    List<OrderPayment> findByOrderId(UUID orderId);

    BigDecimal sumByOrderId(UUID orderId);
}

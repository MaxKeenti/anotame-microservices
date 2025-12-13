package com.anotame.sales.application.port.output;

import com.anotame.sales.domain.model.Order;

public interface OrderRepositoryPort {
    Order save(Order order);

    java.util.List<Order> findAll();
}

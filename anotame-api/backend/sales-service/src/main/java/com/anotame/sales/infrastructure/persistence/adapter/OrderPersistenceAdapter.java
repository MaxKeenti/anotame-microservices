package com.anotame.sales.infrastructure.persistence.adapter;

import com.anotame.sales.application.port.output.OrderRepositoryPort;
import com.anotame.sales.domain.model.Order;
import com.anotame.sales.infrastructure.persistence.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OrderPersistenceAdapter implements OrderRepositoryPort {
    private final OrderRepository orderRepository;

    @Override
    public Order save(Order order) {
        if (order == null) {
            return null;
        }
        return orderRepository.save(order);
    }

    @Override
    public java.util.List<Order> findAll() {
        return orderRepository.findAll();
    }
}

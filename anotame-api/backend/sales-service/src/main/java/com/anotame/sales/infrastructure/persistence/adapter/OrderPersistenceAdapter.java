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

    @Override
    public java.util.Optional<Order> findById(java.util.UUID id) {
        if (id == null) {
            return java.util.Optional.empty();
        }
        return orderRepository.findById(id);
    }

    @Override
    public void delete(java.util.UUID id) {
        if (id != null) {
            orderRepository.findById(id).ifPresent(order -> {
                order.setDeleted(true);
                order.setDeletedAt(java.time.LocalDateTime.now());
                orderRepository.save(order);
            });
        }
    }
}

package com.anotame.sales.infrastructure.persistence.adapter;

import com.anotame.sales.application.port.output.OrderPaymentRepositoryPort;
import com.anotame.sales.domain.model.OrderPayment;
import com.anotame.sales.infrastructure.persistence.entity.OrderPaymentEntity;
import com.anotame.sales.infrastructure.persistence.repository.OrderPaymentRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class OrderPaymentPersistenceAdapter implements OrderPaymentRepositoryPort {

    private final OrderPaymentRepository repository;

    @Override
    @Transactional
    public OrderPayment save(OrderPayment payment) {
        OrderPaymentEntity entity = toEntity(payment);
        repository.persist(entity);
        return toDomain(entity);
    }

    @Override
    public List<OrderPayment> findByOrderId(UUID orderId) {
        return repository.findByOrderId(orderId).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public BigDecimal sumByOrderId(UUID orderId) {
        return repository.sumByOrderId(orderId);
    }

    private OrderPaymentEntity toEntity(OrderPayment domain) {
        OrderPaymentEntity entity = new OrderPaymentEntity();
        entity.setId(domain.getId());
        entity.setOrderId(domain.getOrderId());
        entity.setAmount(domain.getAmount());
        entity.setPaymentMethod(domain.getPaymentMethod());
        entity.setNotes(domain.getNotes());
        entity.setRecordedAt(domain.getRecordedAt());
        entity.setCreatedAt(domain.getCreatedAt());
        return entity;
    }

    private OrderPayment toDomain(OrderPaymentEntity entity) {
        OrderPayment domain = new OrderPayment();
        domain.setId(entity.getId());
        domain.setOrderId(entity.getOrderId());
        domain.setAmount(entity.getAmount());
        domain.setPaymentMethod(entity.getPaymentMethod());
        domain.setNotes(entity.getNotes());
        domain.setRecordedAt(entity.getRecordedAt());
        domain.setCreatedAt(entity.getCreatedAt());
        return domain;
    }
}

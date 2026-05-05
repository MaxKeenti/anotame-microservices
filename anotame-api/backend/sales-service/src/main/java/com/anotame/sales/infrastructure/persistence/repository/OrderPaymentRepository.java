package com.anotame.sales.infrastructure.persistence.repository;

import com.anotame.sales.infrastructure.persistence.entity.OrderPaymentEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class OrderPaymentRepository implements PanacheRepositoryBase<OrderPaymentEntity, UUID> {

    public List<OrderPaymentEntity> findByOrderId(UUID orderId) {
        return list("orderId = ?1 ORDER BY recordedAt ASC", orderId);
    }

    public BigDecimal sumByOrderId(UUID orderId) {
        BigDecimal result = getEntityManager()
                .createQuery(
                        "SELECT COALESCE(SUM(p.amount), 0) FROM OrderPaymentEntity p WHERE p.orderId = :orderId",
                        BigDecimal.class)
                .setParameter("orderId", orderId)
                .getSingleResult();
        return result != null ? result : BigDecimal.ZERO;
    }
}

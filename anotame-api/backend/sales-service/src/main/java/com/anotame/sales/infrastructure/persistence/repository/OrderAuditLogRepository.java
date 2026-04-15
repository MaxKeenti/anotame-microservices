package com.anotame.sales.infrastructure.persistence.repository;

import com.anotame.sales.infrastructure.persistence.entity.OrderAuditLogEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class OrderAuditLogRepository implements PanacheRepository<OrderAuditLogEntity> {
    public void save(OrderAuditLogEntity entry) {
        persist(entry);
    }

    public List<OrderAuditLogEntity> findByOrderId(UUID orderId) {
        return find("orderId", Sort.by("changedAt").descending(), orderId).list();
    }
}

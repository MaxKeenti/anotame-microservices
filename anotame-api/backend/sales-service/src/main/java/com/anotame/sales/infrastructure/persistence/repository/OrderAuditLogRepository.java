package com.anotame.sales.infrastructure.persistence.repository;

import com.anotame.sales.infrastructure.persistence.entity.OrderAuditLogEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class OrderAuditLogRepository implements PanacheRepository<OrderAuditLogEntity> {
    public void save(OrderAuditLogEntity entry) {
        persist(entry);
    }
}

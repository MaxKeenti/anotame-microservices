package com.anotame.sales.infrastructure.persistence.adapter;

import com.anotame.sales.application.port.output.OrderAuditLogRepositoryPort;
import com.anotame.sales.infrastructure.persistence.entity.OrderAuditLogEntity;
import com.anotame.sales.infrastructure.persistence.repository.OrderAuditLogRepository;
import jakarta.enterprise.context.ApplicationScoped;
import lombok.RequiredArgsConstructor;

@ApplicationScoped
@RequiredArgsConstructor
public class OrderAuditLogPersistenceAdapter implements OrderAuditLogRepositoryPort {

    private final OrderAuditLogRepository auditLogRepository;

    @Override
    public void save(OrderAuditLogEntity entry) {
        auditLogRepository.save(entry);
    }
}

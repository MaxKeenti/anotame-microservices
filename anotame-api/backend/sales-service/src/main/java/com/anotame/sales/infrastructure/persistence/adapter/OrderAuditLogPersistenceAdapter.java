package com.anotame.sales.infrastructure.persistence.adapter;

import com.anotame.sales.application.port.output.AuditLogEntry;
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
    public void save(AuditLogEntry entry) {
        OrderAuditLogEntity entity = new OrderAuditLogEntity();
        entity.setOrderId(entry.orderId());
        entity.setUserId(entry.userId());
        entity.setFieldName(entry.fieldName());
        entity.setOldValue(entry.oldValue());
        entity.setNewValue(entry.newValue());
        entity.setChangedAt(entry.changedAt());
        auditLogRepository.save(entity);
    }
}

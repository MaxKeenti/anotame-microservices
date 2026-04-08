package com.anotame.sales.application.port.output;

import com.anotame.sales.infrastructure.persistence.entity.OrderAuditLogEntity;

public interface OrderAuditLogRepositoryPort {
    void save(OrderAuditLogEntity entry);
}

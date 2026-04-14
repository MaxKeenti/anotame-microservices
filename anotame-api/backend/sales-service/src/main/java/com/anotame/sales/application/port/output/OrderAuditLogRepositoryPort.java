package com.anotame.sales.application.port.output;

import java.util.List;
import java.util.UUID;

public interface OrderAuditLogRepositoryPort {
    void save(AuditLogEntry entry);
    List<AuditLogEntry> findByOrderId(UUID orderId);
}

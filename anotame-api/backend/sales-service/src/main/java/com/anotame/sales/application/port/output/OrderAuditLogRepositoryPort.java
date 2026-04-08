package com.anotame.sales.application.port.output;

public interface OrderAuditLogRepositoryPort {
    void save(AuditLogEntry entry);
}

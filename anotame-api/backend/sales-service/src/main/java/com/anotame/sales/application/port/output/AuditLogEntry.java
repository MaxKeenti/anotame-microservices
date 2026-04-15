package com.anotame.sales.application.port.output;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Application-layer value object representing an audit log entry.
 * Used in {@link OrderAuditLogRepositoryPort} to avoid leaking the
 * JPA infrastructure entity into the application layer.
 */
public record AuditLogEntry(
    UUID orderId,
    UUID userId,
    String fieldName,
    String oldValue,
    String newValue,
    OffsetDateTime changedAt
) {}

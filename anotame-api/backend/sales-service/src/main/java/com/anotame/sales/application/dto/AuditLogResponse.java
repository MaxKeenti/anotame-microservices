package com.anotame.sales.application.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AuditLogResponse(
    UUID userId,
    String fieldName,
    String oldValue,
    String newValue,
    OffsetDateTime changedAt
) {}

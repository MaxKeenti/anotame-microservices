package com.anotame.sales.application.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

public record AuditLogResponse(
    UUID userId,
    String fieldName,
    @Schema(nullable = true)
    String oldValue,
    @Schema(nullable = true)
    String newValue,
    OffsetDateTime changedAt
) {}

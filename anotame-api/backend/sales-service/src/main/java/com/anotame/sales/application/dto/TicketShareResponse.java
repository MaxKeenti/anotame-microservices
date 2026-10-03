package com.anotame.sales.application.dto;

import com.anotame.sales.domain.model.TicketShareScope;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Data
@Builder
public class TicketShareResponse {
    private UUID id;
    private TicketShareScope scope;
    private OffsetDateTime createdAt;
    private OffsetDateTime expiresAt;
    @Schema(nullable = true)
    private OffsetDateTime revokedAt;
}

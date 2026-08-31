package com.anotame.sales.application.dto;

import com.anotame.sales.domain.model.TicketShareScope;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class TicketShareResponse {
    private UUID id;
    private TicketShareScope scope;
    private OffsetDateTime createdAt;
    private OffsetDateTime expiresAt;
    private OffsetDateTime revokedAt;
}

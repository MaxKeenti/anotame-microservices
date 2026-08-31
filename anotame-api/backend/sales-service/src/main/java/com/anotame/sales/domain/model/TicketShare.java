package com.anotame.sales.domain.model;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class TicketShare {
    private UUID id;
    private UUID orderId;
    private String tokenHash;
    private UUID createdByUserId;
    private TicketShareScope scope = TicketShareScope.CUSTOMER;
    private OffsetDateTime expiresAt;
    private OffsetDateTime revokedAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private OffsetDateTime deletedAt;
    private boolean deleted;
}

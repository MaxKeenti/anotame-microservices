package com.anotame.sales.application.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class CreatedTicketShareResponse {
    private UUID id;
    private String token;
    private OffsetDateTime expiresAt;
}

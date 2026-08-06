package com.anotame.sales.application.port.output;

import com.anotame.sales.domain.model.TicketShare;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TicketShareRepositoryPort {
    TicketShare save(TicketShare share);

    Optional<TicketShare> findActiveByTokenHash(String tokenHash, OffsetDateTime now);

    List<TicketShare> findByOrderId(UUID orderId);

    Optional<TicketShare> findByIdAndOrderId(UUID shareId, UUID orderId);
}

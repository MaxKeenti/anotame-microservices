package com.anotame.sales.infrastructure.persistence.repository;

import com.anotame.sales.infrastructure.persistence.entity.TicketShareEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class TicketShareRepository implements PanacheRepositoryBase<TicketShareEntity, UUID> {
    public Optional<TicketShareEntity> findActiveByTokenHash(String tokenHash, OffsetDateTime now) {
        return find("tokenHash = ?1 and revokedAt is null and expiresAt > ?2", tokenHash, now)
                .firstResultOptional();
    }

    public List<TicketShareEntity> findByOrderIdNewestFirst(UUID orderId) {
        return list("orderId = ?1 order by createdAt desc", orderId);
    }

    public Optional<TicketShareEntity> findByIdAndOrderId(UUID shareId, UUID orderId) {
        return find("id = ?1 and orderId = ?2", shareId, orderId).firstResultOptional();
    }
}

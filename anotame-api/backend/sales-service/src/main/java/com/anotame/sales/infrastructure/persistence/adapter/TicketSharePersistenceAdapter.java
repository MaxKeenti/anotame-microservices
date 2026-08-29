package com.anotame.sales.infrastructure.persistence.adapter;

import com.anotame.sales.application.port.output.TicketShareRepositoryPort;
import com.anotame.sales.domain.model.TicketShare;
import com.anotame.sales.infrastructure.persistence.entity.TicketShareEntity;
import com.anotame.sales.infrastructure.persistence.repository.TicketShareRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class TicketSharePersistenceAdapter implements TicketShareRepositoryPort {
    private final TicketShareRepository repository;

    @Override
    @Transactional
    public TicketShare save(TicketShare share) {
        TicketShareEntity entity = share.getId() == null
                ? new TicketShareEntity()
                : repository.findByIdOptional(share.getId()).orElseGet(TicketShareEntity::new);

        entity.setOrderId(share.getOrderId());
        entity.setTokenHash(share.getTokenHash());
        entity.setCreatedByUserId(share.getCreatedByUserId());
        entity.setScope(share.getScope());
        entity.setExpiresAt(share.getExpiresAt());
        entity.setRevokedAt(share.getRevokedAt());
        entity.setCreatedAt(share.getCreatedAt());
        entity.setUpdatedAt(share.getUpdatedAt());
        entity.setDeletedAt(share.getDeletedAt());
        entity.setDeleted(share.isDeleted());
        repository.persist(entity);
        return toDomain(entity);
    }

    @Override
    public Optional<TicketShare> findActiveByTokenHash(String tokenHash, OffsetDateTime now) {
        return repository.findActiveByTokenHash(tokenHash, now).map(this::toDomain);
    }

    @Override
    public List<TicketShare> findByOrderId(UUID orderId) {
        return repository.findByOrderIdNewestFirst(orderId).stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<TicketShare> findByIdAndOrderId(UUID shareId, UUID orderId) {
        return repository.findByIdAndOrderId(shareId, orderId).map(this::toDomain);
    }

    private TicketShare toDomain(TicketShareEntity entity) {
        TicketShare share = new TicketShare();
        share.setId(entity.getId());
        share.setOrderId(entity.getOrderId());
        share.setTokenHash(entity.getTokenHash());
        share.setCreatedByUserId(entity.getCreatedByUserId());
        share.setScope(entity.getScope());
        share.setExpiresAt(entity.getExpiresAt());
        share.setRevokedAt(entity.getRevokedAt());
        share.setCreatedAt(entity.getCreatedAt());
        share.setUpdatedAt(entity.getUpdatedAt());
        share.setDeletedAt(entity.getDeletedAt());
        share.setDeleted(entity.isDeleted());
        return share;
    }
}

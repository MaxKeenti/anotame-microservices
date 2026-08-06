package com.anotame.sales.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tco_ticket_share")
@Getter
@Setter
@SQLDelete(sql = "UPDATE tco_ticket_share SET is_deleted = true, deleted_at = NOW() WHERE id_ticket_share = ?")
@SQLRestriction("is_deleted = false")
public class TicketShareEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_ticket_share")
    private UUID id;

    @Column(name = "id_order", nullable = false)
    private UUID orderId;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "created_by_user_id", nullable = false)
    private UUID createdByUserId;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "revoked_at")
    private OffsetDateTime revokedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted;
}

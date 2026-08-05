CREATE TABLE tco_ticket_share (
    id_ticket_share       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_order              UUID NOT NULL REFERENCES tco_order(id_order) ON DELETE CASCADE,
    token_hash            VARCHAR(64) NOT NULL UNIQUE,
    created_by_user_id    UUID NOT NULL,
    expires_at            TIMESTAMPTZ NOT NULL,
    revoked_at            TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at            TIMESTAMPTZ,
    is_deleted            BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_ticket_share_order ON tco_ticket_share(id_order);
CREATE INDEX idx_ticket_share_active_lookup
    ON tco_ticket_share(token_hash, expires_at)
    WHERE revoked_at IS NULL AND is_deleted = FALSE;

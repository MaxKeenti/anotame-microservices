-- Ticket share links now carry the audience they were minted for. CUSTOMER links
-- resolve to the full receipt (including the pickup code); HANDLING links back the
-- QR printed on garment tags, which leave the premises and must never expose it.
ALTER TABLE tco_ticket_share
    ADD COLUMN scope VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER';

ALTER TABLE tco_ticket_share
    ADD CONSTRAINT ck_ticket_share_scope
    CHECK (scope IN ('CUSTOMER', 'HANDLING'));

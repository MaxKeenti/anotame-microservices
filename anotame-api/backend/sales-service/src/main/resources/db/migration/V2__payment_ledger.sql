-- V2: Partial payment ledger
-- Creates tco_order_payment as an append-only ledger of payment entries.
-- amount_paid on tco_order stays as a denormalized cache (recomputed on each insert).
-- Seeded with one entry per order that already has amount_paid > 0.

CREATE TABLE tco_order_payment (
    id_payment      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_order        UUID NOT NULL REFERENCES tco_order(id_order),
    amount          NUMERIC(19,4) NOT NULL CHECK (amount <> 0),
    payment_method  VARCHAR(255),
    notes           VARCHAR(500),
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_payment_order       ON tco_order_payment(id_order);
CREATE INDEX idx_order_payment_recorded_at ON tco_order_payment(recorded_at);

-- Seed: preserve existing payment entries (amount > 0 only; negatives not expected in legacy data)
INSERT INTO tco_order_payment (id_order, amount, payment_method, recorded_at, created_at)
SELECT
    id_order,
    amount_paid,
    payment_method,
    COALESCE(created_at, NOW()),
    COALESCE(created_at, NOW())
FROM tco_order
WHERE amount_paid > 0
  AND is_deleted = FALSE;

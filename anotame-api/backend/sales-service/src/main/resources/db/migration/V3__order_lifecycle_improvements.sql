-- Add pickup_code to tco_order (new column — not in init.sql baseline)
ALTER TABLE tco_order
    ADD COLUMN IF NOT EXISTS pickup_code VARCHAR(6);

-- delivered_at already declared in init.sql schema — no SQL ALTER needed here.
-- Only the Java entity field is missing and will be added below.

-- Field-level audit log table (append-only — no soft delete needed per D-07)
CREATE TABLE IF NOT EXISTS tco_order_audit_log (
    id_audit           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_order           UUID NOT NULL REFERENCES tco_order(id_order) ON DELETE CASCADE,
    user_id            UUID NOT NULL,
    field_name         VARCHAR(100) NOT NULL,
    old_value          TEXT,
    new_value          TEXT,
    changed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_order ON tco_order_audit_log(id_order);

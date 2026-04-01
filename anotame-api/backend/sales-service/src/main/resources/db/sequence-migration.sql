-- Phase 3 DATA-02: collision-free ticket number sequence
-- Apply BEFORE deploying the updated sales-service.
-- IF NOT EXISTS makes this idempotent (safe to re-run).
-- Hibernate ddl-auto=update will NOT create sequences automatically.
CREATE SEQUENCE IF NOT EXISTS tco_ticket_number_seq
    START WITH 1
    INCREMENT BY 1
    NO CYCLE;

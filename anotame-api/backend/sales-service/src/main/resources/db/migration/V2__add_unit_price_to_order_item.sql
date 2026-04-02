-- Migration: Add unit_price column to tco_order_item
-- Migrated from repo-root migration.sql as part of Phase 6 Flyway framework adoption.
-- IF NOT EXISTS guard is intentional: this column was added to existing databases by
-- Hibernate auto-DDL before Flyway was introduced. This migration is a no-op on those DBs.

ALTER TABLE tco_order_item ADD COLUMN IF NOT EXISTS unit_price DECIMAL(19,4) NOT NULL DEFAULT 0.0;

-- V4__add_price_list_to_order.sql
-- Additive migration: adds price list tracking to orders.
-- Both columns nullable — zero risk to existing rows.
ALTER TABLE tco_order
    ADD COLUMN IF NOT EXISTS price_list_id   UUID,
    ADD COLUMN IF NOT EXISTS price_list_name VARCHAR(255);

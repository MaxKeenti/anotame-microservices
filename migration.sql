-- Migration to add unit_price to tco_order_item

ALTER TABLE tco_order_item ADD COLUMN IF NOT EXISTS unit_price DECIMAL(19,4) NOT NULL DEFAULT 0.0;

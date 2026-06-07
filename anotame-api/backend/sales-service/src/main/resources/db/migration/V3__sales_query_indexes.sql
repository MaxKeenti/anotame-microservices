-- V3: Targeted indexes for sales KPI and calendar query paths.

CREATE INDEX idx_order_active_deadline_range
    ON tco_order(committed_deadline)
    WHERE is_deleted = FALSE
      AND status NOT IN ('DELIVERED', 'CANCELLED')
      AND committed_deadline IS NOT NULL;

CREATE INDEX idx_order_active_created_at_range
    ON tco_order(created_at, id_customer)
    WHERE is_deleted = FALSE
      AND created_at IS NOT NULL;

CREATE INDEX idx_order_item_active_order
    ON tco_order_item(id_order)
    WHERE is_deleted = FALSE;

CREATE INDEX idx_order_item_service_order_item
    ON tco_order_item_service(id_order_item);

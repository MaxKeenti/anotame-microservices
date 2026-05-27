-- Add configurable capacity and at-risk threshold columns to tce_establishment
ALTER TABLE tce_establishment
    ADD COLUMN capacity_threshold_green  INTEGER DEFAULT 50,
    ADD COLUMN capacity_threshold_amber  INTEGER DEFAULT 85,
    ADD COLUMN at_risk_days_threshold    INTEGER DEFAULT 60;

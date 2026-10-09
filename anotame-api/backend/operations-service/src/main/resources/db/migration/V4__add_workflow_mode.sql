-- Workflow mode on tce_establishment: FULL keeps every order status and the
-- Operations page; SIMPLE reduces the shop's flow to received and delivered.
ALTER TABLE tce_establishment
    ADD COLUMN workflow_mode VARCHAR(20) NOT NULL DEFAULT 'FULL',
    ADD CONSTRAINT tce_establishment_workflow_mode_check CHECK (workflow_mode IN ('FULL', 'SIMPLE'));

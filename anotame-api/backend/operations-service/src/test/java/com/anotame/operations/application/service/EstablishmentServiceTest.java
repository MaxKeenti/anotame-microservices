package com.anotame.operations.application.service;

import com.anotame.operations.application.port.output.EstablishmentRepositoryPort;
import com.anotame.operations.domain.model.Establishment;
import com.anotame.operations.domain.model.WorkflowMode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class EstablishmentServiceTest {

    private final InMemoryEstablishmentRepository repository = new InMemoryEstablishmentRepository();
    private final EstablishmentService service = new EstablishmentService(repository, new ObjectMapper());

    @Test
    void defaultsToTheFullWorkflowBeforeAnythingIsSaved() {
        assertEquals(WorkflowMode.FULL, service.getSettings().getWorkflowMode());
    }

    @Test
    void savesTheRequestedWorkflowMode() {
        service.updateSettings(establishment(WorkflowMode.SIMPLE));

        assertEquals(WorkflowMode.SIMPLE, service.getSettings().getWorkflowMode());
        assertEquals(WorkflowMode.SIMPLE, service.getPublicReceiptSettings().getWorkflowMode());
    }

    @Test
    void keepsTheStoredWorkflowModeWhenASaveOmitsIt() {
        service.updateSettings(establishment(WorkflowMode.SIMPLE));

        service.updateSettings(establishment(null));

        assertEquals(WorkflowMode.SIMPLE, service.getSettings().getWorkflowMode());
    }

    @Test
    void rejectsAnUnknownWorkflowMode() {
        assertThrows(IllegalArgumentException.class,
                () -> service.updateSettings(establishment("EXPRESS")));
    }

    private Establishment establishment(String workflowMode) {
        Establishment establishment = new Establishment();
        establishment.setName("Sastrería");
        establishment.setWorkflowMode(workflowMode);
        return establishment;
    }

    private static final class InMemoryEstablishmentRepository implements EstablishmentRepositoryPort {
        private Establishment stored;

        @Override
        public Optional<Establishment> getEstablishment() {
            return Optional.ofNullable(stored);
        }

        @Override
        public Establishment save(Establishment establishment) {
            stored = establishment;
            return stored;
        }
    }
}

package com.anotame.operations.application.service;

import com.anotame.operations.application.port.output.EmployeeAssignmentRepositoryPort;
import com.anotame.operations.domain.exception.ActiveBranchNotFoundException;
import com.anotame.operations.domain.exception.AmbiguousActiveBranchException;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class EmployeeAssignmentServiceTest {

    private final StubRepository repository = new StubRepository();
    private final EmployeeAssignmentService service = new EmployeeAssignmentService(repository);

    @Test
    void returnsTheOnlyActiveBranch() {
        UUID branchId = UUID.randomUUID();
        repository.branchIds = List.of(branchId);

        assertEquals(branchId, service.requireSingleActiveBranch(UUID.randomUUID()));
    }

    @Test
    void rejectsAUserWithoutAnActiveBranch() {
        repository.branchIds = List.of();

        assertThrows(ActiveBranchNotFoundException.class,
                () -> service.requireSingleActiveBranch(UUID.randomUUID()));
    }

    @Test
    void rejectsAmbiguousActiveBranches() {
        repository.branchIds = List.of(UUID.randomUUID(), UUID.randomUUID());

        assertThrows(AmbiguousActiveBranchException.class,
                () -> service.requireSingleActiveBranch(UUID.randomUUID()));
    }

    private static class StubRepository implements EmployeeAssignmentRepositoryPort {
        private List<UUID> branchIds = List.of();

        @Override
        public List<UUID> findActiveBranchIds(UUID userId) {
            return branchIds;
        }
    }
}

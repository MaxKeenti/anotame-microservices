package com.anotame.identity.infrastructure.client;

import com.anotame.identity.domain.exception.BranchAssignmentInvalidException;
import com.anotame.identity.domain.exception.BranchAssignmentRequiredException;
import com.anotame.identity.domain.exception.BranchAssignmentUnavailableException;
import com.anotame.identity.infrastructure.client.dto.ActiveBranchResponse;
import jakarta.ws.rs.ProcessingException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class OperationsBranchAssignmentAdapterTest {

    @Test
    void returnsTheBranchFromOperations() {
        UUID branchId = UUID.randomUUID();
        OperationsBranchAssignmentAdapter adapter = adapterReturning(new ActiveBranchResponse(branchId));

        assertEquals(branchId, adapter.requireActiveBranch(UUID.randomUUID()));
    }

    @Test
    void mapsNotFoundToRequiredAssignment() {
        OperationsBranchAssignmentAdapter adapter = adapterThrowing(webException(404));

        assertThrows(BranchAssignmentRequiredException.class,
                () -> adapter.requireActiveBranch(UUID.randomUUID()));
    }

    @Test
    void mapsConflictToInvalidAssignment() {
        OperationsBranchAssignmentAdapter adapter = adapterThrowing(webException(409));

        assertThrows(BranchAssignmentInvalidException.class,
                () -> adapter.requireActiveBranch(UUID.randomUUID()));
    }

    @Test
    void mapsConnectivityFailureToUnavailable() {
        OperationsBranchAssignmentAdapter adapter = adapterThrowing(new ProcessingException("unreachable"));

        assertThrows(BranchAssignmentUnavailableException.class,
                () -> adapter.requireActiveBranch(UUID.randomUUID()));
    }

    private static OperationsBranchAssignmentAdapter adapterReturning(ActiveBranchResponse response) {
        return new OperationsBranchAssignmentAdapter((userId, token) -> response, "test-token");
    }

    private static OperationsBranchAssignmentAdapter adapterThrowing(RuntimeException exception) {
        return new OperationsBranchAssignmentAdapter((userId, token) -> {
            throw exception;
        }, "test-token");
    }

    private static WebApplicationException webException(int status) {
        return new WebApplicationException(Response.status(status).build());
    }
}

package com.anotame.identity.infrastructure.client;

import com.anotame.identity.domain.exception.BranchAssignmentInvalidException;
import com.anotame.identity.domain.exception.BranchAssignmentRequiredException;
import com.anotame.identity.domain.exception.BranchAssignmentUnavailableException;
import com.anotame.identity.infrastructure.client.dto.ActiveBranchResponse;
import com.anotame.observability.http.RequestCorrelationContext;
import jakarta.ws.rs.ProcessingException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

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
    void propagatesTheCurrentRequestIdToOperations() {
        String requestId = UUID.randomUUID().toString();
        AtomicReference<String> propagatedRequestId = new AtomicReference<>();
        RequestCorrelationContext correlationContext = correlationContext(requestId);
        OperationsBranchAssignmentAdapter adapter = new OperationsBranchAssignmentAdapter(
                (userId, token, outgoingRequestId) -> {
                    propagatedRequestId.set(outgoingRequestId);
                    return new ActiveBranchResponse(UUID.randomUUID());
                },
                "test-token",
                correlationContext);

        adapter.requireActiveBranch(UUID.randomUUID());

        assertEquals(requestId, propagatedRequestId.get());
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
        return new OperationsBranchAssignmentAdapter(
                (userId, token, requestId) -> response,
                "test-token",
                correlationContext(UUID.randomUUID().toString()));
    }

    private static OperationsBranchAssignmentAdapter adapterThrowing(RuntimeException exception) {
        return new OperationsBranchAssignmentAdapter(
                (userId, token, requestId) -> {
                    throw exception;
                },
                "test-token",
                correlationContext(UUID.randomUUID().toString()));
    }

    private static RequestCorrelationContext correlationContext(String requestId) {
        RequestCorrelationContext context = new RequestCorrelationContext();
        context.initialize(requestId);
        return context;
    }

    private static WebApplicationException webException(int status) {
        return new WebApplicationException(Response.status(status).build());
    }
}

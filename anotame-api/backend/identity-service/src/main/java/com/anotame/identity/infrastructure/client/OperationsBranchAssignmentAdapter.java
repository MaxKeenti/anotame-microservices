package com.anotame.identity.infrastructure.client;

import com.anotame.identity.application.port.output.BranchAssignmentPort;
import com.anotame.identity.domain.exception.BranchAssignmentInvalidException;
import com.anotame.identity.domain.exception.BranchAssignmentRequiredException;
import com.anotame.identity.domain.exception.BranchAssignmentUnavailableException;
import com.anotame.identity.infrastructure.client.dto.ActiveBranchResponse;
import com.anotame.observability.http.RequestCorrelationContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.ProcessingException;
import jakarta.ws.rs.WebApplicationException;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.UUID;

@ApplicationScoped
public class OperationsBranchAssignmentAdapter implements BranchAssignmentPort {

    private static final Logger log = LoggerFactory.getLogger(OperationsBranchAssignmentAdapter.class);

    private final OperationsBranchAssignmentClient client;
    private final String internalServiceToken;
    private final RequestCorrelationContext correlationContext;

    public OperationsBranchAssignmentAdapter(
            @RestClient OperationsBranchAssignmentClient client,
            @ConfigProperty(name = "anotame.internal-service.token") String internalServiceToken,
            RequestCorrelationContext correlationContext) {
        this.client = client;
        this.internalServiceToken = internalServiceToken;
        this.correlationContext = correlationContext;
    }

    @Override
    public UUID requireActiveBranch(UUID userId) {
        try {
            ActiveBranchResponse response = client.getActiveBranch(
                    userId,
                    internalServiceToken,
                    correlationContext.requestId());
            if (response == null || response.branchId() == null) {
                throw new BranchAssignmentUnavailableException();
            }
            return response.branchId();
        } catch (WebApplicationException exception) {
            int status = exception.getResponse().getStatus();
            if (status == 404) {
                throw new BranchAssignmentRequiredException();
            }
            if (status == 409) {
                throw new BranchAssignmentInvalidException();
            }
            log.warn("Operations active-branch lookup failed for user {} with status {}", userId, status);
            throw new BranchAssignmentUnavailableException();
        } catch (ProcessingException exception) {
            log.warn("Operations active-branch lookup was unavailable for user {}: {}", userId, exception.getMessage());
            throw new BranchAssignmentUnavailableException();
        }
    }
}

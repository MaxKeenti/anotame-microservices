package com.anotame.identity.infrastructure.client;

import com.anotame.identity.infrastructure.client.dto.ActiveBranchResponse;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import java.util.UUID;

@Path("/internal/employee-assignments")
@Produces(MediaType.APPLICATION_JSON)
@RegisterRestClient(configKey = "operations-assignments")
public interface OperationsBranchAssignmentClient {

    @GET
    @Path("/users/{userId}/active-branch")
    ActiveBranchResponse getActiveBranch(
            @PathParam("userId") UUID userId,
            @HeaderParam("X-Internal-Service-Token") String internalServiceToken);
}

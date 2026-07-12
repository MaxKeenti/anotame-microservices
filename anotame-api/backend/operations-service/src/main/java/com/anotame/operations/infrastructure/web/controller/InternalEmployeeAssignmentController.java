package com.anotame.operations.infrastructure.web.controller;

import com.anotame.operations.application.service.EmployeeAssignmentService;
import com.anotame.operations.infrastructure.web.dto.ActiveBranchResponse;
import com.anotame.operations.infrastructure.web.security.InternalServiceAuthenticated;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import lombok.RequiredArgsConstructor;

import java.util.UUID;

@Path("/internal/employee-assignments")
@Produces(MediaType.APPLICATION_JSON)
@InternalServiceAuthenticated
@RequiredArgsConstructor
public class InternalEmployeeAssignmentController {

    private final EmployeeAssignmentService service;

    @GET
    @Path("/users/{userId}/active-branch")
    public ActiveBranchResponse getActiveBranch(@PathParam("userId") UUID userId) {
        return new ActiveBranchResponse(service.requireSingleActiveBranch(userId));
    }
}

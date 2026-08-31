package com.anotame.sales.infrastructure.web.controller;

import com.anotame.sales.application.dto.CreatedTicketShareResponse;
import com.anotame.sales.application.dto.TicketShareResponse;
import com.anotame.sales.application.service.TicketShareService;
import com.anotame.sales.domain.model.TicketShareScope;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.List;
import java.util.UUID;

@Path("/orders/{orderId}/ticket-shares")
@Produces(MediaType.APPLICATION_JSON)
@io.quarkus.security.Authenticated
@RequiredArgsConstructor
public class TicketShareController {
    private final TicketShareService ticketShareService;
    private final JsonWebToken jwt;

    @ConfigProperty(name = "app.default-branch-id")
    UUID defaultBranchId;

    @POST
    public CreatedTicketShareResponse create(
            @PathParam("orderId") UUID orderId,
            @QueryParam("scope") @DefaultValue("CUSTOMER") String scope) {
        return ticketShareService.create(orderId, requireUserId(), branchIdFromJwtOrDefault(), parseScope(scope));
    }

    private TicketShareScope parseScope(String scope) {
        try {
            return TicketShareScope.valueOf(scope.toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new jakarta.ws.rs.BadRequestException("Invalid scope: " + scope);
        }
    }

    @GET
    public List<TicketShareResponse> list(@PathParam("orderId") UUID orderId) {
        return ticketShareService.list(orderId, branchIdFromJwtOrDefault());
    }

    @DELETE
    @Path("/{shareId}")
    public Response revoke(@PathParam("orderId") UUID orderId, @PathParam("shareId") UUID shareId) {
        ticketShareService.revoke(orderId, shareId, branchIdFromJwtOrDefault());
        return Response.noContent().build();
    }

    private UUID requireUserId() {
        String value = jwt.getClaim("user_id");
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw new jakarta.ws.rs.BadRequestException("Missing or invalid user_id claim");
        }
    }

    private UUID branchIdFromJwtOrDefault() {
        String value = jwt.getClaim("branch_id");
        if (value == null || value.isBlank()) {
            return defaultBranchId;
        }
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException exception) {
            throw new jakarta.ws.rs.BadRequestException("Invalid branch_id claim");
        }
    }
}

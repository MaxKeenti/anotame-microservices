package com.anotame.sales.infrastructure.web.controller;

import com.anotame.sales.application.dto.AuditLogResponse;
import com.anotame.sales.application.dto.CreateOrderRequest;
import com.anotame.sales.application.dto.DeliverOrderRequest;
import com.anotame.sales.application.dto.UpdateOrderRequest;
import com.anotame.sales.application.dto.OrderResponse;
import com.anotame.sales.application.service.SalesService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Path("/orders")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@io.quarkus.security.Authenticated
public class OrdersController {

    @Inject
    SalesService salesService;

    @Inject
    JsonWebToken jwt;

    @POST
    public OrderResponse createOrder(@jakarta.validation.Valid CreateOrderRequest request) {
        String userIdClaim = (String) jwt.getClaim("user_id");
        if (userIdClaim == null || userIdClaim.isEmpty()) {
            throw new jakarta.ws.rs.BadRequestException("Missing or invalid user_id claim in JWT token");
        }

        String branchIdClaim = (String) jwt.getClaim("branch_id");
        // Intentional backward compatibility: branch_id is optional with fallback to
        // default branch (Oaxaca #113)
        // This supports newly registered users, legacy sessions, and v1.0 rollout
        // without requiring re-login
        UUID branchId;
        try {
            branchId = (branchIdClaim != null && !branchIdClaim.isEmpty())
                    ? UUID.fromString(branchIdClaim)
                    : UUID.fromString("ea22f4a4-5504-43d9-92f9-30cc17b234d1");
        } catch (IllegalArgumentException e) {
            org.slf4j.LoggerFactory.getLogger(OrdersController.class).error("Invalid branch_id format in JWT token: {}",
                    e.getMessage(), e);
            throw new jakarta.ws.rs.BadRequestException("Invalid request format");
        }

        UUID userId;
        try {
            userId = UUID.fromString(userIdClaim);
        } catch (IllegalArgumentException e) {
            org.slf4j.LoggerFactory.getLogger(OrdersController.class).error("Invalid user_id format in JWT token: {}",
                    e.getMessage(), e);
            throw new jakarta.ws.rs.BadRequestException("Invalid request format");
        }

        return salesService.createOrderDTO(request, userId, branchId);
    }

    @GET
    public List<OrderResponse> getOrders() {
        return salesService.getAllOrders();
    }

    @GET
    @Path("/{id}")
    public OrderResponse getOrder(@PathParam("id") UUID id) {
        return salesService.getOrder(id);
    }

    @PUT
    @Path("/{id}")
    public OrderResponse updateOrder(@PathParam("id") UUID id, @jakarta.validation.Valid UpdateOrderRequest request) {
        String userIdClaim = (String) jwt.getClaim("user_id");
        if (userIdClaim == null || userIdClaim.isEmpty()) {
            throw new jakarta.ws.rs.BadRequestException("Missing or invalid user_id claim in JWT token");
        }
        UUID userId;
        try {
            userId = UUID.fromString(userIdClaim);
        } catch (IllegalArgumentException e) {
            org.slf4j.LoggerFactory.getLogger(OrdersController.class).error("Invalid user_id format in JWT token: {}",
                    e.getMessage(), e);
            throw new jakarta.ws.rs.BadRequestException("Invalid request format");
        }
        String role = jwt.getGroups().stream().findFirst().orElse("EMPLOYEE");
        return salesService.updateOrder(id, request, userId, role);
    }

    @PATCH
    @Path("/{id}/deliver")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public jakarta.ws.rs.core.Response deliverOrder(@PathParam("id") UUID id,
                                                     @jakarta.validation.Valid DeliverOrderRequest body) {
        String userIdClaim = (String) jwt.getClaim("user_id");
        if (userIdClaim == null || userIdClaim.isEmpty()) {
            throw new jakarta.ws.rs.BadRequestException("Missing or invalid user_id claim in JWT token");
        }
        UUID userId;
        try {
            userId = UUID.fromString(userIdClaim);
        } catch (IllegalArgumentException e) {
            org.slf4j.LoggerFactory.getLogger(OrdersController.class).error("Invalid user_id format in JWT token: {}",
                    e.getMessage(), e);
            throw new jakarta.ws.rs.BadRequestException("Invalid request format");
        }
        salesService.deliverOrder(
                id,
                body.getPickupCode(),
                userId,
                Boolean.TRUE.equals(body.getMarkFullyPaid()),
                body.getPaymentMethod());
        return jakarta.ws.rs.core.Response.ok().build();
    }

    @GET
    @Path("/{id}/audit")
    public List<AuditLogResponse> getAuditLog(@PathParam("id") UUID id) {
        return salesService.getAuditLog(id);
    }

    @DELETE
    @Path("/{id}")
    public void deleteOrder(@PathParam("id") UUID id) {
        salesService.deleteOrder(id);
    }

    @PATCH
    @Path("/{id}/status")
    public void updateStatus(@PathParam("id") UUID id, Map<String, String> payload) {
        String status = payload.get("status");
        salesService.updateOrderStatus(id, status);
    }
}

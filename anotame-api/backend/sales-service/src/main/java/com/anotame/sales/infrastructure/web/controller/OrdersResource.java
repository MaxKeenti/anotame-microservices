package com.anotame.sales.infrastructure.web.controller;

import com.anotame.sales.application.dto.CreateOrderRequest;
import com.anotame.sales.application.dto.DashboardMetricsResponse;
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
public class OrdersResource {

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
        if (branchIdClaim == null || branchIdClaim.isEmpty()) {
            throw new jakarta.ws.rs.BadRequestException("Missing or invalid branch_id claim in JWT token");
        }

        UUID userId = UUID.fromString(userIdClaim);
        UUID branchId = UUID.fromString(branchIdClaim);

        return salesService.createOrderDTO(request, userId, branchId);
    }

    @GET
    public List<OrderResponse> getOrders() {
        return salesService.getAllOrders();
    }

    @GET
    @Path("/kpi/dashboard")
    public DashboardMetricsResponse getDashboardMetrics() {
        return salesService.getDashboardMetrics();
    }

    @GET
    @Path("/{id}")
    public OrderResponse getOrder(@PathParam("id") UUID id) {
        return salesService.getOrder(id);
    }

    @PUT
    @Path("/{id}")
    public OrderResponse updateOrder(@PathParam("id") UUID id, @jakarta.validation.Valid CreateOrderRequest request) {
        return salesService.updateOrder(id, request);
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

package com.anotame.sales.infrastructure.web.controller;

import com.anotame.sales.application.dto.AuditLogResponse;
import com.anotame.sales.application.dto.CreateOrderRequest;
import com.anotame.sales.application.dto.DeliverOrderRequest;
import com.anotame.sales.application.dto.UpdateOrderRequest;
import com.anotame.sales.application.dto.OrderResponse;
import com.anotame.sales.application.dto.OrderSummaryPageResponse;
import com.anotame.sales.application.service.SalesService;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import lombok.RequiredArgsConstructor;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Path("/orders")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@io.quarkus.security.Authenticated
@RequiredArgsConstructor
public class OrdersController {

    private static final Logger log = LoggerFactory.getLogger(OrdersController.class);

    private final SalesService salesService;
    private final JsonWebToken jwt;

    @POST
    public OrderResponse createOrder(@jakarta.validation.Valid CreateOrderRequest request) {
        return salesService.createOrderDTO(request, requireUuidClaim("user_id"), requireUuidClaim("branch_id"));
    }

    @GET
    public List<OrderResponse> getOrders() {
        return salesService.getAllOrders();
    }

    @GET
    @Path("/summary")
    public OrderSummaryPageResponse getOrderSummaries(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("search") String search,
            @QueryParam("garmentId") UUID garmentId,
            @QueryParam("garmentSource") String garmentSource,
            @QueryParam("deadline") LocalDate deadline,
            @QueryParam("status") List<String> statuses) {
        return salesService.getOrderSummaries(page, size, search, garmentId, garmentSource, deadline, statuses);
    }

    @GET
    @Path("/{id}")
    public OrderResponse getOrder(@PathParam("id") UUID id) {
        return salesService.getOrder(id);
    }

    @PUT
    @Path("/{id}")
    public OrderResponse updateOrder(@PathParam("id") UUID id, @jakarta.validation.Valid UpdateOrderRequest request) {
        UUID userId = requireUuidClaim("user_id");
        String role = jwt.getGroups().stream().findFirst().orElse("EMPLOYEE");
        return salesService.updateOrder(id, request, userId, role);
    }

    @PATCH
    @Path("/{id}/deliver")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public jakarta.ws.rs.core.Response deliverOrder(@PathParam("id") UUID id,
                                                     @jakarta.validation.Valid DeliverOrderRequest body) {
        UUID userId = requireUuidClaim("user_id");
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

    private UUID requireUuidClaim(String claimName) {
        return readUuidClaim(claimName)
                .orElseThrow(() -> new BadRequestException("Missing or invalid " + claimName + " claim in JWT token"));
    }

    private Optional<UUID> readUuidClaim(String claimName) {
        String claimValue = jwt.getClaim(claimName);
        if (claimValue == null || claimValue.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(UUID.fromString(claimValue));
        } catch (IllegalArgumentException e) {
            log.error("Invalid {} format in JWT token: {}", claimName, e.getMessage(), e);
            throw new BadRequestException("Invalid request format");
        }
    }
}

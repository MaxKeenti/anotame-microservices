package com.anotame.sales.infrastructure.web.controller;

import com.anotame.sales.application.dto.CreateOrderRequest;
import com.anotame.sales.application.dto.OrderResponse;
import com.anotame.sales.domain.model.Order;
import com.anotame.sales.application.service.SalesService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Path("/orders")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class OrdersResource {

    @Inject
    SalesService salesService;

    @POST
    public Order createOrder(CreateOrderRequest request, @HeaderParam("X-User-Name") String username) {
        return salesService.createOrder(request, username);
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
    public OrderResponse updateOrder(@PathParam("id") UUID id, CreateOrderRequest request) {
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

package com.anotame.sales.infrastructure.web.controller;

import com.anotame.sales.application.dto.AddPaymentRequest;
import com.anotame.sales.application.dto.PaymentResponse;
import com.anotame.sales.application.service.PaymentService;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;

@Path("/orders/{orderId}/payments")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class OrderPaymentController {

    @Inject
    PaymentService paymentService;

    @POST
    public Response addPayment(@PathParam("orderId") UUID orderId,
                               @Valid AddPaymentRequest request) {
        PaymentResponse response = paymentService.addPayment(orderId, request);
        return Response.status(Response.Status.CREATED).entity(response).build();
    }

    @GET
    public List<PaymentResponse> getPayments(@PathParam("orderId") UUID orderId) {
        return paymentService.getPayments(orderId);
    }
}

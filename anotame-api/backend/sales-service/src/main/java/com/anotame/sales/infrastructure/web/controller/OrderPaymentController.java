package com.anotame.sales.infrastructure.web.controller;

import com.anotame.sales.application.dto.AddPaymentRequest;
import com.anotame.sales.application.dto.PaymentResponse;
import com.anotame.sales.application.service.PaymentService;
import io.quarkus.security.Authenticated;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import lombok.RequiredArgsConstructor;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponseSchema;
import org.jboss.resteasy.reactive.ResponseStatus;

import java.util.List;
import java.util.UUID;

@Path("/orders/{orderId}/payments")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
@RequiredArgsConstructor
public class OrderPaymentController {

    private final PaymentService paymentService;

    @POST
    @ResponseStatus(201)
    @APIResponseSchema(value = PaymentResponse.class, responseCode = "201")
    public PaymentResponse addPayment(@PathParam("orderId") UUID orderId,
                                      @Valid AddPaymentRequest request) {
        return paymentService.addPayment(orderId, request);
    }

    @GET
    public List<PaymentResponse> getPayments(@PathParam("orderId") UUID orderId) {
        return paymentService.getPayments(orderId);
    }
}

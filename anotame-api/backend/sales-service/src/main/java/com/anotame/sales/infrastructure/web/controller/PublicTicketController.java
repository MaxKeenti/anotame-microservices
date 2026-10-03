package com.anotame.sales.infrastructure.web.controller;

import com.anotame.sales.application.dto.PublicHandlingTicketResponse;
import com.anotame.sales.application.dto.PublicTicketResponse;
import com.anotame.sales.application.service.TicketShareService;
import jakarta.annotation.security.PermitAll;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import lombok.RequiredArgsConstructor;
import org.jboss.resteasy.reactive.RestResponse;

@Path("/tickets")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
@RequiredArgsConstructor
public class PublicTicketController {
    private final TicketShareService ticketShareService;

    @GET
    @Path("/shared/{token}")
    public RestResponse<PublicTicketResponse> get(@PathParam("token") String token) {
        PublicTicketResponse ticket = ticketShareService.getPublicTicket(token);
        return publicResponse(ticket);
    }

    @GET
    @Path("/handling/{token}")
    public RestResponse<PublicHandlingTicketResponse> getHandling(@PathParam("token") String token) {
        PublicHandlingTicketResponse ticket = ticketShareService.getHandlingTicket(token);
        return publicResponse(ticket);
    }

    private <T> RestResponse<T> publicResponse(T body) {
        return RestResponse.ResponseBuilder.ok(body)
                .header("Cache-Control", "no-store")
                .header("X-Robots-Tag", "noindex, nofollow")
                .build();
    }
}

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
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;

@Path("/tickets")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
@RequiredArgsConstructor
public class PublicTicketController {
    private final TicketShareService ticketShareService;

    @GET
    @Path("/shared/{token}")
    public Response get(@PathParam("token") String token) {
        PublicTicketResponse ticket = ticketShareService.getPublicTicket(token);
        return publicResponse(ticket);
    }

    @GET
    @Path("/handling/{token}")
    public Response getHandling(@PathParam("token") String token) {
        PublicHandlingTicketResponse ticket = ticketShareService.getHandlingTicket(token);
        return publicResponse(ticket);
    }

    private Response publicResponse(Object body) {
        return Response.ok(body)
                .header("Cache-Control", "no-store")
                .header("X-Robots-Tag", "noindex, nofollow")
                .build();
    }
}

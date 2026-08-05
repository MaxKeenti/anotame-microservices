package com.anotame.sales.infrastructure.web.controller;

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

@Path("/tickets/shared")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
@RequiredArgsConstructor
public class PublicTicketController {
    private final TicketShareService ticketShareService;

    @GET
    @Path("/{token}")
    public Response get(@PathParam("token") String token) {
        PublicTicketResponse ticket = ticketShareService.getPublicTicket(token);
        return Response.ok(ticket)
                .header("Cache-Control", "no-store")
                .header("X-Robots-Tag", "noindex, nofollow")
                .build();
    }
}

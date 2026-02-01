package com.anotame.operations.infrastructure.web.controller;

import com.anotame.operations.application.service.EstablishmentService;
import com.anotame.operations.domain.model.Establishment;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;

@Path("/establishment")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
public class EstablishmentController {

    private final EstablishmentService service;

    @GET
    public Response getSettings() {
        return Response.ok(service.getSettings()).build();
    }

    @PUT
    public Response updateSettings(Establishment establishment) {
        return Response.ok(service.updateSettings(establishment)).build();
    }
}

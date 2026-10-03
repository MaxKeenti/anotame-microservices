package com.anotame.operations.infrastructure.web.controller;

import com.anotame.operations.application.service.EstablishmentService;
import com.anotame.operations.domain.model.Establishment;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import lombok.RequiredArgsConstructor;

@Path("/establishment")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
@io.quarkus.security.Authenticated
public class EstablishmentController {

    private final EstablishmentService service;

    @GET
    public Establishment getSettings() {
        return service.getSettings();
    }

    @PUT
    public Establishment updateSettings(Establishment establishment) {
        return service.updateSettings(establishment);
    }
}

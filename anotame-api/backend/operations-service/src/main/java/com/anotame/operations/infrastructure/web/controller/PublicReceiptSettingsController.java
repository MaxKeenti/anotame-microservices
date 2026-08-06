package com.anotame.operations.infrastructure.web.controller;

import com.anotame.operations.application.dto.PublicReceiptSettingsResponse;
import com.anotame.operations.application.service.EstablishmentService;
import jakarta.annotation.security.PermitAll;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;

@Path("/establishment/public-receipt-settings")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
@RequiredArgsConstructor
public class PublicReceiptSettingsController {
    private final EstablishmentService establishmentService;

    @GET
    public Response get() {
        return Response.ok(establishmentService.getPublicReceiptSettings())
                .header("Cache-Control", "no-store")
                .header("X-Robots-Tag", "noindex, nofollow")
                .build();
    }
}

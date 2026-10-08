package com.anotame.operations.infrastructure.web.controller;

import com.anotame.operations.application.dto.PublicReceiptSettingsResponse;
import com.anotame.operations.application.service.EstablishmentService;
import jakarta.annotation.security.PermitAll;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import lombok.RequiredArgsConstructor;
import org.jboss.resteasy.reactive.RestResponse;

@Path("/establishment/public-receipt-settings")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
@RequiredArgsConstructor
public class PublicReceiptSettingsController {
    private final EstablishmentService establishmentService;

    @GET
    public RestResponse<PublicReceiptSettingsResponse> get() {
        return RestResponse.ResponseBuilder.ok(establishmentService.getPublicReceiptSettings())
                .header("Cache-Control", "no-store")
                .header("X-Robots-Tag", "noindex, nofollow")
                .build();
    }
}

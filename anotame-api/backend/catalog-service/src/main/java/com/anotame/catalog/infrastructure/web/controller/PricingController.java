package com.anotame.catalog.infrastructure.web.controller;

import com.anotame.catalog.application.service.PriceListService;
import com.anotame.catalog.application.dto.PricingCalculationRequest;
import com.anotame.catalog.application.dto.PricingCalculationResponse;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import lombok.RequiredArgsConstructor;

@Path("/pricing")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@io.quarkus.security.Authenticated
@RequiredArgsConstructor
public class PricingController {

    private final PriceListService priceListService;

    @POST
    @Path("/calculate")
    public PricingCalculationResponse calculate(PricingCalculationRequest request) {
        return priceListService.calculatePrice(request);
    }
}

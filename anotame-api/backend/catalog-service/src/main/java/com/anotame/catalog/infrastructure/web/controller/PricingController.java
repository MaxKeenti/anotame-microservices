package com.anotame.catalog.infrastructure.web.controller;

import com.anotame.catalog.application.service.PriceListService;
import com.anotame.catalog.dto.PricingCalculationRequest;
import com.anotame.catalog.dto.PricingCalculationResponse;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

@Path("/pricing")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@io.quarkus.security.Authenticated
public class PricingController {

    @Inject
    PriceListService priceListService;

    @POST
    @Path("/calculate")
    public PricingCalculationResponse calculate(PricingCalculationRequest request) {
        return priceListService.calculatePrice(request);
    }
}

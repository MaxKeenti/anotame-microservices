package com.anotame.sales.infrastructure.web.controller;

import com.anotame.sales.application.dto.FinancialKpiResponse;
import com.anotame.sales.application.service.SalesService;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

@Path("/orders/kpi/financial")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class FinancialKpiResource {

    @Inject
    SalesService salesService;

    @GET
    public FinancialKpiResponse getFinancialKpis(
            @QueryParam("granularity") @DefaultValue("day") String granularity) {
        return salesService.getFinancialKpis(granularity);
    }
}

package com.anotame.sales.infrastructure.web.controller;

import com.anotame.sales.application.dto.CalendarMonthResponse;
import com.anotame.sales.application.dto.DashboardMetricsResponse;
import com.anotame.sales.application.dto.FinancialKpiResponse;
import com.anotame.sales.application.service.SalesService;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

@Path("/orders/kpi")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class OrderKpiController {

    @Inject
    SalesService salesService;

    @GET
    @Path("/dashboard")
    public DashboardMetricsResponse getDashboardMetrics() {
        return salesService.getDashboardMetrics();
    }

    @GET
    @Path("/calendar")
    public CalendarMonthResponse getCalendarData(
            @QueryParam("month") String month) {
        return salesService.getCalendarData(month);
    }

    @GET
    @Path("/financial")
    public FinancialKpiResponse getFinancialKpis(
            @QueryParam("granularity") @DefaultValue("day") String granularity) {
        return salesService.getFinancialKpis(granularity);
    }
}

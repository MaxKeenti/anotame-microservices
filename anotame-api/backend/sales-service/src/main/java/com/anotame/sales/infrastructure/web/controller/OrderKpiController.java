package com.anotame.sales.infrastructure.web.controller;

import com.anotame.sales.application.dto.CalendarMonthResponse;
import com.anotame.sales.application.dto.DashboardMetricsResponse;
import com.anotame.sales.application.dto.FinancialKpiResponse;
import com.anotame.sales.application.dto.ReceivableOrderPageResponse;
import com.anotame.sales.application.dto.ReceivablesResponse;
import com.anotame.sales.application.service.SalesService;
import io.quarkus.security.Authenticated;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import lombok.RequiredArgsConstructor;

@Path("/orders/kpi")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
@RequiredArgsConstructor
public class OrderKpiController {

    private final SalesService salesService;

    @GET
    @Path("/dashboard")
    public DashboardMetricsResponse getDashboardMetrics(@QueryParam("month") String month) {
        return salesService.getDashboardMetrics(month);
    }

    @GET
    @Path("/calendar")
    public CalendarMonthResponse getCalendarData(
            @QueryParam("month") String month,
            @QueryParam("dailyCapacityMinutes") @DefaultValue("480") int dailyCapacityMinutes) {
        return salesService.getCalendarData(month, dailyCapacityMinutes);
    }

    @GET
    @Path("/receivables")
    public ReceivablesResponse getReceivables() {
        return salesService.getReceivables();
    }

    /**
     * @param delivered when true, lists garments already handed over with a balance instead of
     *                  tickets still in the shop. The two are reported separately, never merged.
     */
    @GET
    @Path("/receivables/orders")
    public ReceivableOrderPageResponse getReceivableOrders(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("delivered") @DefaultValue("false") boolean delivered) {
        return salesService.getReceivableOrders(page, size, delivered);
    }

    @GET
    @Path("/financial")
    public FinancialKpiResponse getFinancialKpis(
            @QueryParam("granularity") @DefaultValue("day") String granularity,
            @QueryParam("atRiskDays") @DefaultValue("60") int atRiskDays) {
        return salesService.getFinancialKpis(granularity, atRiskDays);
    }
}

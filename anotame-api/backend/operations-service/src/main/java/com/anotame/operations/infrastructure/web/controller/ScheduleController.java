package com.anotame.operations.infrastructure.web.controller;

import com.anotame.operations.application.service.ScheduleService;
import com.anotame.operations.domain.model.Holiday;
import com.anotame.operations.domain.model.WorkDay;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Path("/schedule")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    @GET
    @Path("/config")
    public List<WorkDay> getWorkDays() {
        List<WorkDay> days = scheduleService.getAllWorkDays();
        if (days.isEmpty()) {
            // First time init
            return scheduleService.initDefaultSchedule();
        }
        return days;
    }

    @PUT
    @Path("/config")
    public List<WorkDay> updateWorkDays(List<WorkDay> days) {
        for (WorkDay day : days) {
            scheduleService.updateWorkDay(day);
        }
        return scheduleService.getAllWorkDays();
    }

    @GET
    @Path("/holidays")
    public List<Holiday> getHolidays() {
        return scheduleService.getAllHolidays();
    }

    @POST
    @Path("/holidays")
    public Holiday addHoliday(Holiday holiday) {
        return scheduleService.addHoliday(holiday);
    }

    @DELETE
    @Path("/holidays/{id}")
    public Response deleteHoliday(@PathParam("id") UUID id) {
        scheduleService.deleteHoliday(id);
        return Response.noContent().build();
    }

    @GET
    @Path("/check")
    public Map<String, Boolean> checkAvailability(@QueryParam("date") String dateStr) {
        if (dateStr == null) {
            throw new BadRequestException("Date parameter is required (ISO-8601)");
        }
        LocalDateTime dt = LocalDateTime.parse(dateStr); // Assumes ISO '2025-10-10T09:00:00'
        boolean isOpen = scheduleService.isEstablishmentOpen(dt);
        return Map.of("isOpen", isOpen);
    }
}

package com.anotame.sales.application.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class CalendarMonthResponse {
    private List<CalendarDayResponse> days;
}

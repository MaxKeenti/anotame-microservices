package com.anotame.sales.application.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.math.BigDecimal;

@Data
@Builder
public class CalendarDayResponse {
    private LocalDate date;
    private Integer totalMinutesUsed;
    private Integer orderCount;
    private BigDecimal scheduledRevenue;
    private Double capacityPercent;
    private Boolean isHoliday;
    private Boolean isOpen;
}

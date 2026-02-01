package com.anotame.operations.application.port.output;

import com.anotame.operations.domain.model.Holiday;
import com.anotame.operations.domain.model.WorkDay;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ScheduleRepositoryPort {
    List<WorkDay> getAllWorkDays();

    Optional<WorkDay> getWorkDay(int dayOfWeek);

    WorkDay save(WorkDay workDay);

    List<Holiday> getAllHolidays();

    Optional<Holiday> getHoliday(LocalDate date);

    Holiday save(Holiday holiday);

    void deleteHoliday(UUID id);
}

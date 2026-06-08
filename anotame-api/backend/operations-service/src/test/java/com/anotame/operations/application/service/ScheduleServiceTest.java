package com.anotame.operations.application.service;

import com.anotame.operations.application.port.output.ScheduleRepositoryPort;
import com.anotame.operations.domain.model.Holiday;
import com.anotame.operations.domain.model.WorkDay;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ScheduleServiceTest {

    private final InMemoryScheduleRepository repository = new InMemoryScheduleRepository();
    private final ScheduleService service = new ScheduleService(repository);

    @Test
    void opensDuringNormalSameDayHours() {
        repository.putWorkDay(workDay(1, true, LocalTime.of(9, 0), LocalTime.of(18, 0)));

        assertTrue(service.isEstablishmentOpen(LocalDateTime.of(2026, 6, 1, 9, 0)));
        assertTrue(service.isEstablishmentOpen(LocalDateTime.of(2026, 6, 1, 18, 0)));
        assertFalse(service.isEstablishmentOpen(LocalDateTime.of(2026, 6, 1, 18, 1)));
    }

    @Test
    void supportsShiftsThatCrossMidnight() {
        repository.putWorkDay(workDay(1, true, LocalTime.of(22, 0), LocalTime.of(2, 0)));

        assertTrue(service.isEstablishmentOpen(LocalDateTime.of(2026, 6, 1, 23, 0)));
        assertTrue(service.isEstablishmentOpen(LocalDateTime.of(2026, 6, 2, 1, 30)));
        assertFalse(service.isEstablishmentOpen(LocalDateTime.of(2026, 6, 2, 2, 1)));
    }

    @Test
    void holidaysCloseSameDayAndPreventPreviousDayCarryover() {
        repository.putWorkDay(workDay(1, true, LocalTime.of(22, 0), LocalTime.of(2, 0)));
        repository.putHoliday(LocalDate.of(2026, 6, 2));

        assertFalse(service.isEstablishmentOpen(LocalDateTime.of(2026, 6, 2, 1, 30)));
    }

    private WorkDay workDay(int dayOfWeek, boolean open, LocalTime openTime, LocalTime closeTime) {
        WorkDay day = new WorkDay();
        day.setDayOfWeek(dayOfWeek);
        day.setOpen(open);
        day.setOpenTime(openTime);
        day.setCloseTime(closeTime);
        return day;
    }

    private static class InMemoryScheduleRepository implements ScheduleRepositoryPort {
        private final Map<Integer, WorkDay> workDays = new HashMap<>();
        private final Map<LocalDate, Holiday> holidays = new HashMap<>();

        void putWorkDay(WorkDay workDay) {
            workDays.put(workDay.getDayOfWeek(), workDay);
        }

        void putHoliday(LocalDate date) {
            Holiday holiday = new Holiday();
            holiday.setDate(date);
            holidays.put(date, holiday);
        }

        @Override
        public List<WorkDay> getAllWorkDays() {
            return new ArrayList<>(workDays.values());
        }

        @Override
        public Optional<WorkDay> getWorkDay(int dayOfWeek) {
            return Optional.ofNullable(workDays.get(dayOfWeek));
        }

        @Override
        public WorkDay save(WorkDay workDay) {
            putWorkDay(workDay);
            return workDay;
        }

        @Override
        public List<Holiday> getAllHolidays() {
            return new ArrayList<>(holidays.values());
        }

        @Override
        public Optional<Holiday> getHoliday(LocalDate date) {
            return Optional.ofNullable(holidays.get(date));
        }

        @Override
        public Holiday save(Holiday holiday) {
            holidays.put(holiday.getDate(), holiday);
            return holiday;
        }

        @Override
        public void deleteHoliday(UUID id) {
        }
    }
}

package com.anotame.operations.application.service;

import com.anotame.operations.application.port.output.ScheduleRepositoryPort;
import com.anotame.operations.domain.model.Holiday;
import com.anotame.operations.domain.model.WorkDay;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleRepositoryPort scheduleRepository;

    public boolean isEstablishmentOpen(LocalDateTime dateTime) {
        LocalDate date = dateTime.toLocalDate();
        LocalTime time = dateTime.toLocalTime();

        // 1. Check Holiday
        Optional<Holiday> holiday = scheduleRepository.getHoliday(date);
        if (holiday.isPresent()) {
            return false; // Closed on holidays
        }

        // 2. Check Work Day
        int divOfWeek = date.getDayOfWeek().getValue(); // 1=Mon, 7=Sun
        Optional<WorkDay> workDayOpt = scheduleRepository.getWorkDay(divOfWeek);

        if (workDayOpt.isEmpty()) {
            return false; // Default closed if not defined
        }

        WorkDay workDay = workDayOpt.get();
        if (!workDay.isOpen()) {
            return false;
        }

        // 3. Check Hours
        // Handle simplified case: if openTime or closeTime is null, assume open all
        // day?
        // Or if closeTime < openTime (night shift)? Not handling night shift crossing
        // midnight for now.
        if (workDay.getOpenTime() != null && time.isBefore(workDay.getOpenTime())) {
            return false;
        }
        if (workDay.getCloseTime() != null && time.isAfter(workDay.getCloseTime())) {
            return false;
        }

        return true;
    }

    public List<WorkDay> getAllWorkDays() {
        return scheduleRepository.getAllWorkDays();
    }

    @Transactional
    public WorkDay updateWorkDay(WorkDay workDay) {
        // Validation logic could go here
        return scheduleRepository.save(workDay);
    }

    @Transactional
    public List<WorkDay> initDefaultSchedule() {
        // Helper to init Mon-Fri 9-6
        for (int i = 1; i <= 7; i++) {
            WorkDay day = new WorkDay();
            day.setDayOfWeek(i);
            day.setOpen(i <= 5); // Mon-Fri open
            day.setOpenTime(LocalTime.of(9, 0));
            day.setCloseTime(LocalTime.of(18, 0));
            scheduleRepository.save(day);
        }
        return getAllWorkDays();
    }

    public List<Holiday> getAllHolidays() {
        return scheduleRepository.getAllHolidays();
    }

    @Transactional
    public Holiday addHoliday(Holiday holiday) {
        return scheduleRepository.save(holiday);
    }

    @Transactional
    public void deleteHoliday(UUID id) {
        scheduleRepository.deleteHoliday(id);
    }
}

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

        if (isHoliday(date)) {
            return false;
        }

        Optional<WorkDay> workDayOpt = scheduleRepository.getWorkDay(date.getDayOfWeek().getValue());
        if (workDayOpt.isPresent() && isOpenDuringWorkDate(workDayOpt.get(), time)) {
            return true;
        }

        LocalDate previousDate = date.minusDays(1);
        if (isHoliday(previousDate)) {
            return false;
        }

        return scheduleRepository.getWorkDay(previousDate.getDayOfWeek().getValue())
                .filter(workDay -> carriesIntoNextDate(workDay, time))
                .isPresent();
    }

    private boolean isHoliday(LocalDate date) {
        return scheduleRepository.getHoliday(date).isPresent();
    }

    private boolean isOpenDuringWorkDate(WorkDay workDay, LocalTime time) {
        if (!workDay.isOpen()) {
            return false;
        }
        LocalTime openTime = workDay.getOpenTime();
        LocalTime closeTime = workDay.getCloseTime();

        if (openTime == null && closeTime == null) {
            return true;
        }
        if (openTime == null) {
            return !time.isAfter(closeTime);
        }
        if (closeTime == null) {
            return !time.isBefore(openTime);
        }
        if (crossesMidnight(workDay)) {
            return !time.isBefore(openTime);
        }
        return !time.isBefore(openTime) && !time.isAfter(closeTime);
    }

    private boolean carriesIntoNextDate(WorkDay workDay, LocalTime time) {
        if (!workDay.isOpen() || !crossesMidnight(workDay)) {
            return false;
        }
        return !time.isAfter(workDay.getCloseTime());
    }

    private boolean crossesMidnight(WorkDay workDay) {
        return workDay.getOpenTime() != null
                && workDay.getCloseTime() != null
                && workDay.getCloseTime().isBefore(workDay.getOpenTime());
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

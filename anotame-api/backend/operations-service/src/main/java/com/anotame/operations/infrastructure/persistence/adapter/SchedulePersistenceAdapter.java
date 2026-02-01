package com.anotame.operations.infrastructure.persistence.adapter;

import com.anotame.operations.application.port.output.ScheduleRepositoryPort;
import com.anotame.operations.domain.model.Holiday;
import com.anotame.operations.domain.model.WorkDay;
import com.anotame.operations.infrastructure.persistence.entity.HolidayJpa;
import com.anotame.operations.infrastructure.persistence.entity.WorkDayJpa;
import com.anotame.operations.infrastructure.persistence.repository.HolidayRepository;
import com.anotame.operations.infrastructure.persistence.repository.WorkDayRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@ApplicationScoped
public class SchedulePersistenceAdapter implements ScheduleRepositoryPort {

    @Inject
    WorkDayRepository workDayRepository;

    @Inject
    HolidayRepository holidayRepository;

    @Override
    public List<WorkDay> getAllWorkDays() {
        return workDayRepository.listAll().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<WorkDay> getWorkDay(int dayOfWeek) {
        return workDayRepository.findByDayOfWeek(dayOfWeek)
                .map(this::toDomain);
    }

    @Override
    @Transactional
    public WorkDay save(WorkDay workDay) {
        WorkDayJpa entity = null;
        if (workDay.getId() != null) {
            entity = workDayRepository.findById(workDay.getId());
        }
        if (entity == null) {
            // Check by DayOfWeek if creating new logic
            Optional<WorkDayJpa> existing = workDayRepository.findByDayOfWeek(workDay.getDayOfWeek());
            if (existing.isPresent()) {
                entity = existing.get();
            } else {
                entity = new WorkDayJpa();
            }
        }

        entity.setDayOfWeek(workDay.getDayOfWeek());
        entity.setOpen(workDay.isOpen());
        entity.setOpenTime(workDay.getOpenTime());
        entity.setCloseTime(workDay.getCloseTime());

        workDayRepository.persist(entity);
        return toDomain(entity);
    }

    @Override
    public List<Holiday> getAllHolidays() {
        return holidayRepository.listAll().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Holiday> getHoliday(LocalDate date) {
        return holidayRepository.findByDate(date)
                .map(this::toDomain);
    }

    @Override
    @Transactional
    public Holiday save(Holiday holiday) {
        HolidayJpa entity = null;
        if (holiday.getId() != null) {
            entity = holidayRepository.findById(holiday.getId());
        }
        if (entity == null) {
            entity = new HolidayJpa();
        }

        entity.setDate(holiday.getDate());
        entity.setDescription(holiday.getDescription());

        holidayRepository.persist(entity);
        return toDomain(entity);
    }

    @Override
    @Transactional
    public void deleteHoliday(UUID id) {
        holidayRepository.deleteById(id);
    }

    private WorkDay toDomain(WorkDayJpa entity) {
        WorkDay domain = new WorkDay();
        domain.setId(entity.getId());
        domain.setDayOfWeek(entity.getDayOfWeek());
        domain.setOpen(entity.isOpen());
        domain.setOpenTime(entity.getOpenTime());
        domain.setCloseTime(entity.getCloseTime());
        return domain;
    }

    private Holiday toDomain(HolidayJpa entity) {
        Holiday domain = new Holiday();
        domain.setId(entity.getId());
        domain.setDate(entity.getDate());
        domain.setDescription(entity.getDescription());
        return domain;
    }
}

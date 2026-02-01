package com.anotame.operations.infrastructure.persistence.repository;

import com.anotame.operations.infrastructure.persistence.entity.HolidayJpa;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class HolidayRepository implements PanacheRepositoryBase<HolidayJpa, UUID> {
    public Optional<HolidayJpa> findByDate(LocalDate date) {
        return find("date", date).firstResultOptional();
    }
}

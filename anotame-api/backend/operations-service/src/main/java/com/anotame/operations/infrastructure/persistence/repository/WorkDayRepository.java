package com.anotame.operations.infrastructure.persistence.repository;

import com.anotame.operations.infrastructure.persistence.entity.WorkDayJpa;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class WorkDayRepository implements PanacheRepositoryBase<WorkDayJpa, UUID> {
    public Optional<WorkDayJpa> findByDayOfWeek(int dayOfWeek) {
        return find("dayOfWeek", dayOfWeek).firstResultOptional();
    }
}

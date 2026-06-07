package com.anotame.operations.infrastructure.persistence.repository;

import com.anotame.operations.infrastructure.persistence.entity.WorkDayEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class WorkDayRepository implements PanacheRepositoryBase<WorkDayEntity, UUID> {
    public Optional<WorkDayEntity> findByDayOfWeek(int dayOfWeek) {
        return find("dayOfWeek", dayOfWeek).firstResultOptional();
    }
}

package com.anotame.operations.infrastructure.persistence.repository;

import com.anotame.operations.infrastructure.persistence.entity.WorkShiftJpa;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class WorkShiftRepository implements PanacheRepositoryBase<WorkShiftJpa, UUID> {
    public List<WorkShiftJpa> findByUserId(UUID userId) {
        return find("userId", userId).list();
    }
}

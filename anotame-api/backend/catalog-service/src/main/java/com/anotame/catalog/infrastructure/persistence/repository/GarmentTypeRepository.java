package com.anotame.catalog.infrastructure.persistence.repository;

import com.anotame.catalog.infrastructure.persistence.entity.GarmentTypeEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class GarmentTypeRepository implements PanacheRepositoryBase<GarmentTypeEntity, UUID> {

    public List<GarmentTypeEntity> findByActiveTrue() {
        return find("active", true).list();
    }

    public Optional<GarmentTypeEntity> findActiveByNameIgnoreCase(String name) {
        return find("lower(trim(name)) = ?1 and active = true", name.trim().toLowerCase()).firstResultOptional();
    }
}

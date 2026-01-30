package com.anotame.catalog.infrastructure.persistence.repository;

import com.anotame.catalog.domain.model.GarmentType;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class GarmentTypeRepository implements PanacheRepositoryBase<GarmentType, UUID> {

    public List<GarmentType> findByActiveTrue() {
        return find("active", true).list();
    }

    public boolean existsByCode(String code) {
        return count("code", code) > 0;
    }
}

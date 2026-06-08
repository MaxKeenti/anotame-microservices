package com.anotame.catalog.infrastructure.persistence.repository;

import com.anotame.catalog.infrastructure.persistence.entity.ServiceEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class ServiceRepository implements PanacheRepositoryBase<ServiceEntity, UUID> {

    public List<ServiceEntity> findByActiveTrue() {
        return find("active", true).list();
    }
}

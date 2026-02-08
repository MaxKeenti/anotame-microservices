package com.anotame.catalog.infrastructure.persistence.repository;

import com.anotame.catalog.domain.model.Service;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class ServiceRepository implements PanacheRepositoryBase<Service, UUID> {

    public List<Service> findByActiveTrue() {
        return find("active", true).list();
    }

    public boolean existsByCode(String code) {
        return count("code", code) > 0;
    }
}

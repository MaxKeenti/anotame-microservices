package com.anotame.identity.infrastructure.persistence.repository;

import com.anotame.identity.infrastructure.persistence.entity.RoleEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class RoleRepository implements PanacheRepositoryBase<RoleEntity, UUID> {

    public Optional<RoleEntity> findByCode(String code) {
        return find("code", code).firstResultOptional();
    }
}

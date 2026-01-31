package com.anotame.identity.infrastructure.persistence.repository;

import com.anotame.identity.domain.model.Role;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class RoleRepository implements PanacheRepositoryBase<Role, UUID> {

    public Optional<Role> findByCode(String code) {
        return find("code", code).firstResultOptional();
    }
}

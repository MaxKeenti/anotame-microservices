package com.anotame.identity.application.port.output;

import com.anotame.identity.domain.model.Role;

import java.util.Optional;
import java.util.UUID;

public interface RoleRepositoryPort {

    Optional<Role> findById(UUID id);

    Optional<Role> findByCode(String code);
}

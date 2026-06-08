package com.anotame.identity.infrastructure.persistence.adapter;

import com.anotame.identity.application.port.output.RoleRepositoryPort;
import com.anotame.identity.domain.model.Role;
import com.anotame.identity.infrastructure.persistence.entity.RoleEntity;
import com.anotame.identity.infrastructure.persistence.repository.RoleRepository;
import jakarta.enterprise.context.ApplicationScoped;
import lombok.RequiredArgsConstructor;

import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class RolePersistenceAdapter implements RoleRepositoryPort {

    private final RoleRepository roleRepository;

    @Override
    public Optional<Role> findById(UUID id) {
        return roleRepository.findByIdOptional(id)
                .map(this::toDomain);
    }

    @Override
    public Optional<Role> findByCode(String code) {
        return roleRepository.findByCode(code)
                .map(this::toDomain);
    }

    private Role toDomain(RoleEntity entity) {
        Role role = new Role();
        role.setId(entity.getId());
        role.setCode(entity.getCode());
        role.setName(entity.getName());
        role.setDescription(entity.getDescription());
        role.setActive(entity.isActive());
        role.setCreatedAt(entity.getCreatedAt());
        role.setUpdatedAt(entity.getUpdatedAt());
        role.setDeletedAt(entity.getDeletedAt());
        role.setDeleted(entity.isDeleted());
        return role;
    }
}

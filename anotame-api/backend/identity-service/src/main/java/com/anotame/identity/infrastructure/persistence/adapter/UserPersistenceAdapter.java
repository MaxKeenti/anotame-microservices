package com.anotame.identity.infrastructure.persistence.adapter;

import com.anotame.identity.application.port.output.UserRepositoryPort;
import com.anotame.identity.domain.model.Role;
import com.anotame.identity.domain.model.User;
import com.anotame.identity.infrastructure.persistence.entity.RoleEntity;
import com.anotame.identity.infrastructure.persistence.entity.UserEntity;
import com.anotame.identity.infrastructure.persistence.repository.RoleRepository;
import com.anotame.identity.infrastructure.persistence.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class UserPersistenceAdapter implements UserRepositoryPort {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    public List<User> findAll() {
        return userRepository.listAll().stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public Optional<User> findById(UUID id) {
        return userRepository.findByIdOptional(id)
                .map(this::toDomain);
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username)
                .map(this::toDomain);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(this::toDomain);
    }

    @Override
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    @Transactional
    public User save(User user) {
        UserEntity entity = user.getId() == null
                ? new UserEntity()
                : userRepository.findByIdOptional(user.getId())
                        .orElseThrow(() -> new IllegalStateException("User not found: " + user.getId()));

        applyDomain(entity, user);

        if (entity.getId() == null) {
            userRepository.persist(entity);
        }

        return toDomain(entity);
    }

    @Override
    @Transactional
    public boolean deleteById(UUID id) {
        return userRepository.deleteById(id);
    }

    private void applyDomain(UserEntity entity, User user) {
        entity.setUsername(user.getUsername());
        entity.setPassword(user.getPassword());
        entity.setFirstName(user.getFirstName());
        entity.setLastName(user.getLastName());
        entity.setEmail(user.getEmail());
        entity.setLocale(user.getLocale());
        entity.setActive(user.isActive());
        entity.setDeleted(user.isDeleted());
        entity.setDeletedAt(user.getDeletedAt());
        entity.setRole(toRoleEntity(user.getRole()));
    }

    private RoleEntity toRoleEntity(Role role) {
        if (role == null) {
            return null;
        }
        if (role.getId() != null) {
            return roleRepository.findByIdOptional(role.getId())
                    .orElseThrow(() -> new IllegalStateException("Role not found: " + role.getId()));
        }
        return roleRepository.findByCode(role.getCode())
                .orElseThrow(() -> new IllegalStateException("Role not found: " + role.getCode()));
    }

    private User toDomain(UserEntity entity) {
        User user = new User();
        user.setId(entity.getId());
        user.setUsername(entity.getUsername());
        user.setPassword(entity.getPassword());
        user.setFirstName(entity.getFirstName());
        user.setLastName(entity.getLastName());
        user.setEmail(entity.getEmail());
        user.setLocale(entity.getLocale());
        user.setActive(entity.isActive());
        user.setRole(toDomain(entity.getRole()));
        user.setCreatedAt(entity.getCreatedAt());
        user.setUpdatedAt(entity.getUpdatedAt());
        user.setDeletedAt(entity.getDeletedAt());
        user.setDeleted(entity.isDeleted());
        return user;
    }

    private Role toDomain(RoleEntity entity) {
        if (entity == null) {
            return null;
        }
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

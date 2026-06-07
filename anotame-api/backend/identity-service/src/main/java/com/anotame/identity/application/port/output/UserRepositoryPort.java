package com.anotame.identity.application.port.output;

import com.anotame.identity.domain.model.User;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepositoryPort {

    List<User> findAll();

    Optional<User> findById(UUID id);

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    User save(User user);

    boolean deleteById(UUID id);

    UUID findActiveBranchForUser(UUID userId);
}

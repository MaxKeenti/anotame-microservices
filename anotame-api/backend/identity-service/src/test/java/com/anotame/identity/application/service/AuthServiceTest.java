package com.anotame.identity.application.service;

import com.anotame.identity.application.dto.LoginRequest;
import com.anotame.identity.application.port.output.BranchAssignmentPort;
import com.anotame.identity.application.port.output.PasswordHasherPort;
import com.anotame.identity.application.port.output.TokenGeneratorPort;
import com.anotame.identity.application.port.output.UserRepositoryPort;
import com.anotame.identity.domain.exception.BranchAssignmentRequiredException;
import com.anotame.identity.domain.model.Role;
import com.anotame.identity.domain.model.User;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AuthServiceTest {

    @Test
    void issuesTheTokenWithTheOperationsOwnedBranch() {
        User user = staffUser();
        UUID branchId = UUID.randomUUID();
        CapturingTokenGenerator tokenGenerator = new CapturingTokenGenerator();
        AuthService service = new AuthService(
                new StubUserRepository(user),
                matchingPasswordHasher(),
                tokenGenerator,
                ignored -> branchId);

        service.login(LoginRequest.builder().username(user.getUsername()).password("secret").build());

        assertEquals(branchId, tokenGenerator.branchId);
    }

    @Test
    void failsClosedWhenNoActiveBranchExists() {
        User user = staffUser();
        BranchAssignmentPort missingAssignment = ignored -> {
            throw new BranchAssignmentRequiredException();
        };
        AuthService service = new AuthService(
                new StubUserRepository(user),
                matchingPasswordHasher(),
                new CapturingTokenGenerator(),
                missingAssignment);

        assertThrows(BranchAssignmentRequiredException.class,
                () -> service.login(LoginRequest.builder()
                        .username(user.getUsername())
                        .password("secret")
                        .build()));
    }

    private static User staffUser() {
        Role role = new Role();
        role.setCode("EMPLOYEE");

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("employee");
        user.setPassword("hashed");
        user.setRole(role);
        return user;
    }

    private static PasswordHasherPort matchingPasswordHasher() {
        return new PasswordHasherPort() {
            @Override
            public String hash(String rawPassword) {
                return "hashed";
            }

            @Override
            public boolean matches(String rawPassword, String hashedPassword) {
                return "secret".equals(rawPassword) && "hashed".equals(hashedPassword);
            }
        };
    }

    private static class CapturingTokenGenerator implements TokenGeneratorPort {
        private UUID branchId;

        @Override
        public String generateToken(String username, UUID userId, UUID branchId, Set<String> roles) {
            this.branchId = branchId;
            return "token";
        }
    }

    private static class StubUserRepository implements UserRepositoryPort {
        private final User user;

        private StubUserRepository(User user) {
            this.user = user;
        }

        @Override
        public List<User> findAll() {
            return List.of(user);
        }

        @Override
        public Optional<User> findById(UUID id) {
            return Optional.of(user);
        }

        @Override
        public Optional<User> findByUsername(String username) {
            return user.getUsername().equals(username) ? Optional.of(user) : Optional.empty();
        }

        @Override
        public Optional<User> findByEmail(String email) {
            return Optional.empty();
        }

        @Override
        public boolean existsByUsername(String username) {
            return user.getUsername().equals(username);
        }

        @Override
        public boolean existsByEmail(String email) {
            return false;
        }

        @Override
        public User save(User user) {
            return user;
        }

        @Override
        public boolean deleteById(UUID id) {
            return false;
        }
    }
}

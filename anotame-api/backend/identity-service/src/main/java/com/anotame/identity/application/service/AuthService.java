package com.anotame.identity.application.service;

import com.anotame.identity.application.dto.AuthResponse;
import com.anotame.identity.application.dto.ChangeCredentialsRequest;
import com.anotame.identity.application.dto.LoginRequest;
import com.anotame.identity.application.dto.UserResponse;
import com.anotame.identity.application.port.output.PasswordHasherPort;
import com.anotame.identity.application.port.output.TokenGeneratorPort;
import com.anotame.identity.application.port.output.UserRepositoryPort;
import com.anotame.identity.domain.exception.InvalidCredentialsException;
import com.anotame.identity.domain.exception.ResourceNotFoundException;
import com.anotame.identity.domain.exception.UserAlreadyExistsException;
import com.anotame.identity.domain.model.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class AuthService {

        private final UserRepositoryPort userRepository;
        private final PasswordHasherPort passwordHasher;
        private final TokenGeneratorPort tokenGenerator;

        @ConfigProperty(name = "app.default-branch-id")
        Optional<UUID> defaultBranchId;

        public AuthResponse login(LoginRequest request) {
                var user = userRepository.findByUsername(request.getUsername())
                                .orElseThrow(() -> new InvalidCredentialsException());

                if (!passwordHasher.matches(request.getPassword(), user.getPassword())) {
                        throw new InvalidCredentialsException();
                }

                return buildAuthResponse(user);
        }

        public UserResponse getUser(String username) {
                var user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User"));

                return mapToResponse(user);
        }

        @Transactional
        public AuthResponse updateCredentials(String username, ChangeCredentialsRequest request) {
                var user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User"));

                if (!passwordHasher.matches(request.getCurrentPassword(), user.getPassword())) {
                        throw new InvalidCredentialsException();
                }

                if (request.getNewUsername() != null && !request.getNewUsername().isBlank()
                                && !request.getNewUsername().equals(user.getUsername())) {
                        if (userRepository.existsByUsername(request.getNewUsername())) {
                                throw new UserAlreadyExistsException(request.getNewUsername());
                        }
                        user.setUsername(request.getNewUsername());
                }

                if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
                        user.setPassword(passwordHasher.hash(request.getNewPassword()));
                }

                User savedUser = userRepository.save(user);
                return buildAuthResponse(savedUser);
        }

        private AuthResponse buildAuthResponse(User user) {
                Set<String> roles = rolesFor(user);
                UUID branchId = userRepository.findActiveBranchForUser(user.getId());
                if (branchId == null) {
                        branchId = defaultBranchId.orElse(null);
                }
                var jwtToken = tokenGenerator.generateToken(user.getUsername(), user.getId(), branchId, roles);

                var userResponse = mapToResponse(user);

                return AuthResponse.builder()
                                .token(jwtToken)
                                .user(userResponse)
                                .build();
        }

        private Set<String> rolesFor(User user) {
                if (user.getRole() == null) {
                        return Set.of();
                }
                return Set.of(user.getRole().getCode());
        }

        private UserResponse mapToResponse(User user) {
                return UserResponse.builder()
                                .id(user.getId())
                                .username(user.getUsername())
                                .email(user.getEmail())
                                .firstName(user.getFirstName())
                                .lastName(user.getLastName())
                                .role(user.getRole() != null ? user.getRole().getCode() : null)
                                .locale(user.getLocale())
                                .build();
        }
}

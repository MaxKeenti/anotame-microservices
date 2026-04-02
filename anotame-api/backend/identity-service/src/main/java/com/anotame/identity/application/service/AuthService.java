package com.anotame.identity.application.service;

import com.anotame.identity.application.dto.AuthResponse;
import com.anotame.identity.application.dto.LoginRequest;
import com.anotame.identity.application.dto.RegisterRequest;
import com.anotame.identity.domain.exception.InvalidCredentialsException;
import com.anotame.identity.domain.exception.ResourceNotFoundException;
import com.anotame.identity.domain.exception.UserAlreadyExistsException;
import com.anotame.identity.domain.model.User;
import com.anotame.identity.infrastructure.persistence.repository.RoleRepository;
import com.anotame.identity.infrastructure.persistence.repository.UserRepository;
import com.anotame.identity.infrastructure.security.JwtUtils;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class AuthService {

        private final RoleRepository roleRepository;
        private final UserRepository userRepository;
        private final JwtUtils jwtUtils;

        @Transactional
        public AuthResponse register(RegisterRequest request) {
                if (userRepository.existsByUsername(request.getUsername())) {
                        throw new UserAlreadyExistsException(request.getUsername());
                }

                var user = new User();
                user.setFirstName(request.getFirstName());
                user.setLastName(request.getLastName());
                user.setUsername(request.getUsername());
                user.setEmail(request.getEmail());
                user.setPassword(io.quarkus.elytron.security.common.BcryptUtil.bcryptHash(request.getPassword()));

                com.anotame.identity.domain.model.Role role = roleRepository.findByCode("EMPLOYEE")
                                .orElseGet(() -> {
                                        var newRole = new com.anotame.identity.domain.model.Role();
                                        newRole.setCode("EMPLOYEE");
                                        newRole.setName("Staff");
                                        newRole.setDescription("Auto-created Staff Role");
                                        roleRepository.persist(newRole);
                                        return newRole;
                                });
                user.setRole(role);

                userRepository.persist(user);

                return login(new LoginRequest(request.getUsername(), request.getPassword()));
        }

        public AuthResponse login(LoginRequest request) {
                var user = userRepository.findByUsername(request.getUsername())
                                .orElseThrow(() -> new InvalidCredentialsException());

                if (!io.quarkus.elytron.security.common.BcryptUtil.matches(request.getPassword(), user.getPassword())) {
                        throw new InvalidCredentialsException();
                }

                Set<String> roles = new HashSet<>();
                if (user.getRole() != null) {
                        roles.add(user.getRole().getCode());
                }

                UUID branchId = userRepository.findActiveBranchForUser(user.getId());
                var jwtToken = jwtUtils.generateToken(user.getUsername(), user.getId(), branchId, roles);

                var userResponse = com.anotame.identity.application.dto.UserResponse.builder()
                                .id(user.getId())
                                .username(user.getUsername())
                                .email(user.getEmail())
                                .firstName(user.getFirstName())
                                .lastName(user.getLastName())
                                .role(user.getRole() != null ? user.getRole().getCode() : null)
                                .build();

                return AuthResponse.builder()
                                .token(jwtToken)
                                .user(userResponse)
                                .build();
        }

        public com.anotame.identity.application.dto.UserResponse getUser(String username) {
                var user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User"));

                return com.anotame.identity.application.dto.UserResponse.builder()
                                .id(user.getId())
                                .username(user.getUsername())
                                .email(user.getEmail())
                                .firstName(user.getFirstName())
                                .lastName(user.getLastName())
                                .role(user.getRole() != null ? user.getRole().getCode() : null)
                                .build();
        }

        @Transactional
        public AuthResponse updateCredentials(String username,
                        com.anotame.identity.application.dto.ChangeCredentialsRequest request) {
                var user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User"));

                // Verify current password
                if (!io.quarkus.elytron.security.common.BcryptUtil.matches(request.getCurrentPassword(),
                                user.getPassword())) {
                        throw new InvalidCredentialsException();
                }

                // Update Username if provided and different
                if (request.getNewUsername() != null && !request.getNewUsername().isBlank()
                                && !request.getNewUsername().equals(user.getUsername())) {
                        if (userRepository.existsByUsername(request.getNewUsername())) {
                                throw new UserAlreadyExistsException(request.getNewUsername());
                        }
                        user.setUsername(request.getNewUsername());
                }

                // Update Password if provided
                if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
                        user.setPassword(io.quarkus.elytron.security.common.BcryptUtil
                                        .bcryptHash(request.getNewPassword()));
                }

                // Persist changes (implicit in transaction, but good for clarity/hooks)
                // userRepository.persist(user);

                // Return new token/auth response since username might have changed
                Set<String> roles = new HashSet<>();
                if (user.getRole() != null) {
                        roles.add(user.getRole().getCode());
                }

                UUID branchId = userRepository.findActiveBranchForUser(user.getId());
                var jwtToken = jwtUtils.generateToken(user.getUsername(), user.getId(), branchId, roles);

                var userResponse = com.anotame.identity.application.dto.UserResponse.builder()
                                .id(user.getId())
                                .username(user.getUsername())
                                .email(user.getEmail())
                                .firstName(user.getFirstName())
                                .lastName(user.getLastName())
                                .role(user.getRole() != null ? user.getRole().getCode() : null)
                                .build();

                return AuthResponse.builder()
                                .token(jwtToken)
                                .user(userResponse)
                                .build();
        }
}

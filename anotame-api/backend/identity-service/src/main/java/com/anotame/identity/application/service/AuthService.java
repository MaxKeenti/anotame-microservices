package com.anotame.identity.application.service;

import com.anotame.identity.application.dto.AuthResponse;
import com.anotame.identity.application.dto.LoginRequest;
import com.anotame.identity.application.dto.RegisterRequest;
import com.anotame.identity.domain.model.User;
import com.anotame.identity.infrastructure.persistence.repository.RoleRepository;
import com.anotame.identity.infrastructure.persistence.repository.UserRepository;
import com.anotame.identity.infrastructure.security.JwtUtils;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@ApplicationScoped
@RequiredArgsConstructor
public class AuthService {

        private final RoleRepository roleRepository;
        private final UserRepository userRepository;
        private final JwtUtils jwtUtils;

        @Transactional
        public AuthResponse register(RegisterRequest request) {
                if (userRepository.existsByUsername(request.getUsername())) {
                        throw new RuntimeException("Username already taken");
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
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (!io.quarkus.elytron.security.common.BcryptUtil.matches(request.getPassword(), user.getPassword())) {
                        throw new RuntimeException("Invalid credentials");
                }

                Set<String> roles = new HashSet<>();
                if (user.getRole() != null) {
                        roles.add(user.getRole().getCode());
                }

                var jwtToken = jwtUtils.generateToken(user.getUsername(), roles);

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
                                .orElseThrow(() -> new RuntimeException("User not found"));

                return com.anotame.identity.application.dto.UserResponse.builder()
                                .id(user.getId())
                                .username(user.getUsername())
                                .email(user.getEmail())
                                .firstName(user.getFirstName())
                                .lastName(user.getLastName())
                                .role(user.getRole() != null ? user.getRole().getCode() : null)
                                .build();
        }
}

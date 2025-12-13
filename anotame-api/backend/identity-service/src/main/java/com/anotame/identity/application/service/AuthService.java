package com.anotame.identity.application.service;

import com.anotame.identity.application.dto.AuthResponse;
import com.anotame.identity.application.dto.LoginRequest;
import com.anotame.identity.application.dto.RegisterRequest;
import com.anotame.identity.domain.model.User;
import com.anotame.identity.infrastructure.persistence.repository.RoleRepository;
import com.anotame.identity.infrastructure.persistence.repository.UserRepository;
import com.anotame.identity.infrastructure.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class AuthService {

        private final RoleRepository roleRepository;
        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtUtils jwtUtils;
        private final AuthenticationManager authenticationManager;

        public AuthResponse register(RegisterRequest request) {
                if (userRepository.existsByUsername(request.getUsername())) {
                        throw new RuntimeException("Username already taken");
                }

                var user = new User();
                user.setFirstName(request.getFirstName());
                user.setLastName(request.getLastName());
                user.setUsername(request.getUsername());
                user.setEmail(request.getEmail());
                user.setPassword(passwordEncoder.encode(request.getPassword()));

                System.out.println("DEBUG: Finding Role EMPLOYEE");
                com.anotame.identity.domain.model.Role role = roleRepository.findByCode("EMPLOYEE")
                                .orElseGet(() -> {
                                        System.out.println("DEBUG: Role EMPLOYEE NOT FOUND! Creating it...");
                                        var newRole = new com.anotame.identity.domain.model.Role();
                                        newRole.setCode("EMPLOYEE");
                                        newRole.setName("Staff");
                                        newRole.setDescription("Auto-created Staff Role");
                                        return roleRepository.save(newRole);
                                });
                System.out.println("DEBUG: Found/Created Role: " + role.getId());
                user.setRole(role);

                userRepository.save(user);

                // Return token immediately after register
                return login(new LoginRequest(request.getUsername(), request.getPassword()));
        }

        public AuthResponse login(LoginRequest request) {
                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                request.getUsername(),
                                                request.getPassword()));
                var user = userRepository.findByUsername(request.getUsername())
                                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

                // Create simple UserDetails impl (or use a wrapper class)
                // For simplicity returning standard UserDetails here
                UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                                user.getUsername(),
                                user.getPassword(),
                                new ArrayList<>() // Authorities/Roles to be mapped later
                );

                var jwtToken = jwtUtils.generateToken(userDetails);
                return AuthResponse.builder()
                                .token(jwtToken)
                                .build();
        }
}

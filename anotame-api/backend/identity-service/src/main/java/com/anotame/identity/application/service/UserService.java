package com.anotame.identity.application.service;

import com.anotame.identity.application.dto.CreateUserRequest;
import com.anotame.identity.application.dto.UpdateUserRequest;
import com.anotame.identity.application.dto.UserResponse;
import com.anotame.identity.application.port.output.PasswordHasherPort;
import com.anotame.identity.application.port.output.RoleRepositoryPort;
import com.anotame.identity.application.port.output.UserRepositoryPort;
import com.anotame.identity.domain.exception.ResourceNotFoundException;
import com.anotame.identity.domain.exception.UserAlreadyExistsException;
import com.anotame.identity.domain.model.Role;
import com.anotame.identity.domain.model.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class UserService {

    private final UserRepositoryPort userRepository;
    private final RoleRepositoryPort roleRepository;
    private final PasswordHasherPort passwordHasher;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException(request.getUsername());
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPassword(passwordHasher.hash(request.getPassword()));

        String roleCode = request.getRole() != null ? request.getRole().toUpperCase() : "EMPLOYEE";
        Role role = roleRepository.findByCode(roleCode)
                .orElseThrow(() -> new ResourceNotFoundException("Role '" + roleCode + "'"));
        user.setRole(role);

        return mapToResponse(userRepository.save(user));
    }

    public UserResponse getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User"));
        return mapToResponse(user);
    }

    @Transactional
    public UserResponse updateUser(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User"));

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());

        return mapToResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(UUID id) {
        userRepository.deleteById(id);
    }

    @Transactional
    public void updateLocale(UUID userId, String locale) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User"));
        user.setLocale(locale);
        userRepository.save(user);
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole() != null ? user.getRole().getCode() : "UNKNOWN")
                .locale(user.getLocale())
                .build();
    }
}

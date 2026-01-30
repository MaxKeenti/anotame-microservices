package com.anotame.identity.application.service;

import com.anotame.identity.application.dto.UpdateUserRequest;
import com.anotame.identity.application.dto.UserResponse;
import com.anotame.identity.domain.model.User;
import com.anotame.identity.infrastructure.persistence.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@ApplicationScoped
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public UserResponse getUserById(UUID id) {
        User user = userRepository.findById(id);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        return mapToResponse(user);
    }

    @Transactional
    public UserResponse updateUser(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());

        // userRepository.persist(user); // Not needed for updates within transaction
        return mapToResponse(user);
    }

    @Transactional
    public void deleteUser(UUID id) {
        userRepository.deleteById(id);
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole() != null ? user.getRole().getCode() : "UNKNOWN")
                .build();
    }
}

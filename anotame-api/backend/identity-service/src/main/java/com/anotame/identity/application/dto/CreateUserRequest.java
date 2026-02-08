package com.anotame.identity.application.dto;

import lombok.Data;

@Data
public class CreateUserRequest {
    private String username;
    private String password;
    private String email;
    private String firstName;
    private String lastName;
    private String role; // "ADMIN" or "EMPLOYEE"
}

package com.anotame.sales.application.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class CustomerDto {
    private UUID id;

    @jakarta.validation.constraints.NotBlank(message = "First name is required")
    private String firstName;

    private String lastName;

    @jakarta.validation.constraints.Email(message = "Invalid email format")
    private String email;

    @jakarta.validation.constraints.NotBlank(message = "Phone number is required")
    private String phoneNumber;

    private java.util.Map<String, Object> preferences;
}

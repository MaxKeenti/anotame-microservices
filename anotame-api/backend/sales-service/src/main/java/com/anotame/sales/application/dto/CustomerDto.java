package com.anotame.sales.application.dto;

import lombok.Data;
import java.util.UUID;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Data
public class CustomerDto {
    private UUID id;

    @jakarta.validation.constraints.NotBlank(message = "First name is required")
    private String firstName;

    @Schema(nullable = true)
    private String lastName;

    @jakarta.validation.constraints.Email(message = "Invalid email format")
    @Schema(nullable = true)
    private String email;

    @jakarta.validation.constraints.NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @Schema(nullable = true)
    private java.util.Map<String, Object> preferences;
}

package com.anotame.sales.application.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class CustomerDto {
    private UUID id;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private java.util.Map<String, Object> preferences;
}

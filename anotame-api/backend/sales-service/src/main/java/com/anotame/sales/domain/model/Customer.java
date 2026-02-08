package com.anotame.sales.domain.model;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Map;

@Data
public class Customer {
    private UUID id;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private Map<String, Object> preferences;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private boolean deleted = false;
}

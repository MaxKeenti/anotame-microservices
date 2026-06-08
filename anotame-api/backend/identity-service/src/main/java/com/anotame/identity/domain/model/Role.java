package com.anotame.identity.domain.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class Role {

    private UUID id;
    private String code;
    private String name;
    private String description;
    private boolean active = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private boolean deleted = false;
}

package com.anotame.catalog.domain.model;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class Service {

    private UUID id;
    private String name;
    private String description;
    private Integer defaultDurationMin = 30;
    private BigDecimal basePrice = BigDecimal.ZERO;
    private boolean active = true;
    private GarmentType garmentType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private boolean deleted = false;
}

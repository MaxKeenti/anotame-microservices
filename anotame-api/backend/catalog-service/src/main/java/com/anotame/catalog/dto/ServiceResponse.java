package com.anotame.catalog.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ServiceResponse {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private Integer defaultDurationMin;
    private BigDecimal basePrice;
}

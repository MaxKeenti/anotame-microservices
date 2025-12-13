package com.anotame.catalog.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ServiceRequest {
    private String code;
    private String name;
    private String description;
    private Integer defaultDurationMin;
    private BigDecimal basePrice;
}

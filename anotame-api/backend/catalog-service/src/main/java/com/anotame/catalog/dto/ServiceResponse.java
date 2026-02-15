package com.anotame.catalog.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ServiceResponse {
    private UUID id;
    private String name;
    private String description;
    private Integer defaultDurationMin;
    private BigDecimal basePrice;
    private UUID garmentTypeId;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getDefaultDurationMin() {
        return defaultDurationMin;
    }

    public void setDefaultDurationMin(Integer defaultDurationMin) {
        this.defaultDurationMin = defaultDurationMin;
    }

    public BigDecimal getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(BigDecimal basePrice) {
        this.basePrice = basePrice;
    }

    public UUID getGarmentTypeId() {
        return garmentTypeId;
    }

    public void setGarmentTypeId(UUID garmentTypeId) {
        this.garmentTypeId = garmentTypeId;
    }
}

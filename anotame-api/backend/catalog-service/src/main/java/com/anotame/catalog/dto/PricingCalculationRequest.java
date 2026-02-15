package com.anotame.catalog.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class PricingCalculationRequest {
    private UUID serviceId;
    private LocalDateTime date; // defaults to now if null

    public UUID getServiceId() {
        return serviceId;
    }

    public void setServiceId(UUID serviceId) {
        this.serviceId = serviceId;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }
}

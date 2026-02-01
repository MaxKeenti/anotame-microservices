package com.anotame.catalog.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class PricingCalculationRequest {
    private UUID serviceId;
    private LocalDateTime date; // defaults to now if null
}

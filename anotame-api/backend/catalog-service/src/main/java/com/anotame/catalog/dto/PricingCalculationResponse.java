package com.anotame.catalog.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PricingCalculationResponse {
    private UUID serviceId;
    private BigDecimal finalPrice;
    private String source; // "BASE_PRICE" or Price List Name
    private UUID priceListId; // Null if base
}

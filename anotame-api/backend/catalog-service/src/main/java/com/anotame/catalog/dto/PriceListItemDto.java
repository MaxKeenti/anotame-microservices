package com.anotame.catalog.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PriceListItemDto {
    private UUID serviceId;
    private String serviceName;
    private BigDecimal price;
    private BigDecimal basePrice; // For reference
}

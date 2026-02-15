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

    public UUID getServiceId() {
        return serviceId;
    }

    public void setServiceId(UUID serviceId) {
        this.serviceId = serviceId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(BigDecimal basePrice) {
        this.basePrice = basePrice;
    }
}

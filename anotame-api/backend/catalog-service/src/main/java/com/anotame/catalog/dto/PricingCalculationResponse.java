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

    public UUID getServiceId() {
        return serviceId;
    }

    public void setServiceId(UUID serviceId) {
        this.serviceId = serviceId;
    }

    public BigDecimal getFinalPrice() {
        return finalPrice;
    }

    public void setFinalPrice(BigDecimal finalPrice) {
        this.finalPrice = finalPrice;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public UUID getPriceListId() {
        return priceListId;
    }

    public void setPriceListId(UUID priceListId) {
        this.priceListId = priceListId;
    }
}

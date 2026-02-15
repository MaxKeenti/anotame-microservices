package com.anotame.catalog.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class PriceListRequest {
    private String name;
    private LocalDateTime validFrom;
    private LocalDateTime validTo;
    private boolean active;
    private Integer priority;
    private List<ItemRequest> items;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDateTime getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(LocalDateTime validFrom) {
        this.validFrom = validFrom;
    }

    public LocalDateTime getValidTo() {
        return validTo;
    }

    public void setValidTo(LocalDateTime validTo) {
        this.validTo = validTo;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    public List<ItemRequest> getItems() {
        return items;
    }

    public void setItems(List<ItemRequest> items) {
        this.items = items;
    }

    @Data
    public static class ItemRequest {
        private UUID serviceId;
        private BigDecimal price;

        public UUID getServiceId() {
            return serviceId;
        }

        public void setServiceId(UUID serviceId) {
            this.serviceId = serviceId;
        }

        public BigDecimal getPrice() {
            return price;
        }

        public void setPrice(BigDecimal price) {
            this.price = price;
        }
    }
}

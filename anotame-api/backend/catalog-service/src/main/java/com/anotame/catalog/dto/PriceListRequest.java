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

    @Data
    public static class ItemRequest {
        private UUID serviceId;
        private BigDecimal price;
    }
}

package com.anotame.catalog.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class PriceListResponse {
    private UUID id;
    private String name;
    private LocalDateTime validFrom;
    private LocalDateTime validTo;
    private boolean active;
    private Integer priority;
    private List<PriceListItemDto> items;
}

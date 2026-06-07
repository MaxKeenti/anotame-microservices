package com.anotame.catalog.domain.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class PriceList {

    private UUID id;
    private String name;
    private LocalDateTime validFrom;
    private LocalDateTime validTo;
    private boolean active = true;
    private Integer priority = 0;
    private List<PriceListItem> items = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean deleted = false;
    private LocalDateTime deletedAt;

    public void addItem(PriceListItem item) {
        items.add(item);
        item.setPriceList(this);
    }
}

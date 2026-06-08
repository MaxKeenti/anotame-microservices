package com.anotame.catalog.application.port.output;

import com.anotame.catalog.domain.model.PriceListItem;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PriceListItemRepositoryPort {

    Optional<PriceListItem> findEffectiveItem(UUID serviceId, LocalDateTime date);

    List<PriceListItem> findActiveOverrides(LocalDateTime date);
}

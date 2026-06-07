package com.anotame.catalog.infrastructure.persistence.adapter;

import com.anotame.catalog.application.port.output.PriceListItemRepositoryPort;
import com.anotame.catalog.domain.model.PriceListItem;
import com.anotame.catalog.infrastructure.persistence.repository.PriceListItemRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class PriceListItemPersistenceAdapter implements PriceListItemRepositoryPort {

    private final PriceListItemRepository repository;

    public PriceListItemPersistenceAdapter(PriceListItemRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<PriceListItem> findEffectiveItem(UUID serviceId, LocalDateTime date) {
        if (serviceId == null || date == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(repository.findEffectiveItem(serviceId, date));
    }

    @Override
    public List<PriceListItem> findActiveOverrides(LocalDateTime date) {
        if (date == null) {
            return List.of();
        }
        return repository.findActiveOverrides(date);
    }
}

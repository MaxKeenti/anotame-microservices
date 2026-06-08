package com.anotame.catalog.infrastructure.persistence.repository;

import com.anotame.catalog.infrastructure.persistence.entity.PriceListItemEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.UUID;

@ApplicationScoped
public class PriceListItemRepository implements PanacheRepositoryBase<PriceListItemEntity, UUID> {

    /**
     * Finds the highest priority price override for a given service at a specific
     * date.
     */
    public PriceListItemEntity findEffectiveItem(UUID serviceId, java.time.LocalDateTime date) {
        return find(
                "service.id = ?1 AND priceList.active = true AND priceList.validFrom <= ?2 AND (priceList.validTo >= ?2 OR priceList.validTo IS NULL)",
                io.quarkus.panache.common.Sort.descending("priceList.priority"),
                serviceId, date)
                .firstResult();
    }

    public java.util.List<PriceListItemEntity> findActiveOverrides(java.time.LocalDateTime date) {
        return list(
                "priceList.active = true AND priceList.validFrom <= ?1 AND (priceList.validTo >= ?1 OR priceList.validTo IS NULL)",
                io.quarkus.panache.common.Sort.descending("priceList.priority"),
                date);
    }
}

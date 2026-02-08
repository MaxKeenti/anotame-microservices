package com.anotame.catalog.infrastructure.persistence.repository;

import com.anotame.catalog.domain.model.PriceList;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class PriceListRepository implements PanacheRepositoryBase<PriceList, UUID> {

    /**
     * Finds all active price lists that are valid for the given date.
     * Use Sort to ensure higher priority comes first.
     */
    public List<PriceList> findActiveForDate(LocalDateTime date) {
        return find("active = true AND validFrom <= ?1 AND (validTo >= ?1 OR validTo IS NULL)",
                io.quarkus.panache.common.Sort.descending("priority"), // Sort by priority desc
                date).list();
    }
}

package com.anotame.catalog.application.port.output;

import com.anotame.catalog.domain.model.PriceList;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PriceListRepositoryPort {

    List<PriceList> findAll();

    Optional<PriceList> findById(UUID id);

    PriceList save(PriceList priceList);

    boolean deleteById(UUID id);
}

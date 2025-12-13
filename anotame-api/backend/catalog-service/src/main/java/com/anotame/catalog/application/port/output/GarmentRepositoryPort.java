package com.anotame.catalog.application.port.output;

import com.anotame.catalog.domain.model.GarmentType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GarmentRepositoryPort {
    List<GarmentType> findAllActive();

    Optional<GarmentType> findById(UUID id);

    GarmentType save(GarmentType garmentType);

    void delete(UUID id);
}

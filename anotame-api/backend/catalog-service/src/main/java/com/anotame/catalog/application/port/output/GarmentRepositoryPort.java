package com.anotame.catalog.application.port.output;

import com.anotame.catalog.domain.model.GarmentType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GarmentRepositoryPort {
    List<GarmentType> findAllActive();

    Optional<GarmentType> findById(UUID id);

    /** Case-insensitive lookup among active garments, used to reject duplicate names. */
    Optional<GarmentType> findActiveByName(String name);

    GarmentType save(GarmentType garmentType);

    void delete(UUID id);
}

package com.anotame.catalog.infrastructure.persistence.adapter;

import com.anotame.catalog.application.port.output.GarmentRepositoryPort;
import com.anotame.catalog.domain.model.GarmentType;
import com.anotame.catalog.infrastructure.persistence.repository.GarmentTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class GarmentPersistenceAdapter implements GarmentRepositoryPort {

    private final GarmentTypeRepository repository;

    @Override
    public List<GarmentType> findAllActive() {
        return repository.findByActiveTrue();
    }

    @Override
    public Optional<GarmentType> findById(UUID id) {
        return repository.findById(id);
    }

    @Override
    public GarmentType save(GarmentType garmentType) {
        return repository.save(garmentType);
    }
}

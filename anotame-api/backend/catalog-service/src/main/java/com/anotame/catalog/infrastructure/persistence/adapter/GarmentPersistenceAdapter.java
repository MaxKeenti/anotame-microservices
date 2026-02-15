package com.anotame.catalog.infrastructure.persistence.adapter;

import com.anotame.catalog.application.port.output.GarmentRepositoryPort;
import com.anotame.catalog.domain.model.GarmentType;
import com.anotame.catalog.infrastructure.persistence.repository.GarmentTypeRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class GarmentPersistenceAdapter implements GarmentRepositoryPort {

    private final GarmentTypeRepository repository;

    public GarmentPersistenceAdapter(GarmentTypeRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<GarmentType> findAllActive() {
        return repository.findByActiveTrue();
    }

    @Override
    public Optional<GarmentType> findById(UUID id) {
        if (id == null) {
            return Optional.empty();
        }
        return repository.findByIdOptional(id);
    }

    @Override
    @Transactional
    public GarmentType save(GarmentType garmentType) {
        if (garmentType == null) {
            return null;
        }
        if (garmentType.getId() == null) {
            repository.persist(garmentType);
        }
        // If entity is already persisted (has ID) and is managed, changes are
        // auto-flushed.
        // If passed entity is detached (from Controller Request -> DTO -> Entity with
        // ID),
        // we might need merge. PanacheRepository doesn't have merge.
        // But `CatalogService` usually fetches entity first, then modifies it
        // (attached).
        // Exceptions: New entity (Id null) -> Persist.
        // Let's assume standard attached entities for updates.
        return garmentType;
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (id != null) {
            repository.findByIdOptional(id).ifPresent(garment -> {
                garment.setActive(false);
                // No explicit save needed if attached and Transactional
            });
        }
    }
}

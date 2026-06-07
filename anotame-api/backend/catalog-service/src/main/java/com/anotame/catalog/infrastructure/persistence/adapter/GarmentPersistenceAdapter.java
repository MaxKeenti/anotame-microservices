package com.anotame.catalog.infrastructure.persistence.adapter;

import com.anotame.catalog.application.port.output.GarmentRepositoryPort;
import com.anotame.catalog.domain.model.GarmentType;
import com.anotame.catalog.infrastructure.persistence.entity.GarmentTypeEntity;
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
        return repository.findByActiveTrue().stream()
                .map(CatalogPersistenceMapper::toDomain)
                .toList();
    }

    @Override
    public Optional<GarmentType> findById(UUID id) {
        if (id == null) {
            return Optional.empty();
        }
        return repository.findByIdOptional(id)
                .map(CatalogPersistenceMapper::toDomain);
    }

    @Override
    @Transactional
    public GarmentType save(GarmentType garmentType) {
        if (garmentType == null) {
            return null;
        }
        GarmentTypeEntity entity = garmentType.getId() == null
                ? new GarmentTypeEntity()
                : repository.findByIdOptional(garmentType.getId())
                        .orElseThrow(() -> new IllegalStateException("Garment type not found: " + garmentType.getId()));

        CatalogPersistenceMapper.apply(entity, garmentType);

        if (entity.getId() == null) {
            repository.persist(entity);
        }

        return CatalogPersistenceMapper.toDomain(entity);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (id != null) {
            repository.findByIdOptional(id).ifPresent(garment -> {
                garment.setActive(false);
            });
        }
    }
}

package com.anotame.catalog.infrastructure.persistence.adapter;

import com.anotame.catalog.application.port.output.ServiceRepositoryPort;
import com.anotame.catalog.domain.model.GarmentType;
import com.anotame.catalog.domain.model.Service;
import com.anotame.catalog.infrastructure.persistence.entity.GarmentTypeEntity;
import com.anotame.catalog.infrastructure.persistence.entity.ServiceEntity;
import com.anotame.catalog.infrastructure.persistence.repository.GarmentTypeRepository;
import com.anotame.catalog.infrastructure.persistence.repository.ServiceRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class ServicePersistenceAdapter implements ServiceRepositoryPort {

    private final ServiceRepository repository;
    private final GarmentTypeRepository garmentTypeRepository;

    public ServicePersistenceAdapter(ServiceRepository repository, GarmentTypeRepository garmentTypeRepository) {
        this.repository = repository;
        this.garmentTypeRepository = garmentTypeRepository;
    }

    @Override
    @Transactional
    public List<Service> findAllActive() {
        return repository.findByActiveTrue().stream()
                .map(CatalogPersistenceMapper::toDomain)
                .toList();
    }

    @Override
    @Transactional
    public Optional<Service> findById(UUID id) {
        if (id == null) {
            return Optional.empty();
        }
        return repository.findByIdOptional(id)
                .map(CatalogPersistenceMapper::toDomain);
    }

    @Override
    @Transactional
    public Service save(Service service) {
        if (service == null) {
            return null;
        }
        ServiceEntity entity = service.getId() == null
                ? new ServiceEntity()
                : repository.findByIdOptional(service.getId())
                        .orElseThrow(() -> new IllegalStateException("Service not found: " + service.getId()));

        CatalogPersistenceMapper.apply(entity, service, findGarmentTypeEntity(service.getGarmentType()));

        if (entity.getId() == null) {
            repository.persist(entity);
        }

        return CatalogPersistenceMapper.toDomain(entity);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (id != null) {
            repository.findByIdOptional(id).ifPresent(service -> {
                service.setActive(false);
            });
        }
    }

    private GarmentTypeEntity findGarmentTypeEntity(GarmentType garmentType) {
        if (garmentType == null) {
            return null;
        }
        if (garmentType.getId() == null) {
            throw new IllegalStateException("Garment type id is required");
        }
        return garmentTypeRepository.findByIdOptional(garmentType.getId())
                .orElseThrow(() -> new IllegalStateException("Garment type not found: " + garmentType.getId()));
    }
}

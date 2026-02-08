package com.anotame.catalog.infrastructure.persistence.adapter;

import com.anotame.catalog.application.port.output.ServiceRepositoryPort;
import com.anotame.catalog.domain.model.Service;
import com.anotame.catalog.infrastructure.persistence.repository.ServiceRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class ServicePersistenceAdapter implements ServiceRepositoryPort {

    private final ServiceRepository repository;

    @Override
    public List<Service> findAllActive() {
        return repository.findByActiveTrue();
    }

    @Override
    public Optional<Service> findById(UUID id) {
        if (id == null) {
            return Optional.empty();
        }
        return repository.findByIdOptional(id);
    }

    @Override
    @Transactional
    public Service save(Service service) {
        if (service == null) {
            return null;
        }
        if (service.getId() == null) {
            repository.persist(service);
        }
        return service;
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
}

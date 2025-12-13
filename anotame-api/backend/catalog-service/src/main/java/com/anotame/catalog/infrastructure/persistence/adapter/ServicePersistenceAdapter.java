package com.anotame.catalog.infrastructure.persistence.adapter;

import com.anotame.catalog.application.port.output.ServiceRepositoryPort;
import com.anotame.catalog.domain.model.Service;
import com.anotame.catalog.infrastructure.persistence.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ServicePersistenceAdapter implements ServiceRepositoryPort {

    private final ServiceRepository repository;

    @Override
    public List<Service> findAllActive() {
        return repository.findByActiveTrue();
    }

    @Override
    public Optional<Service> findById(UUID id) {
        return repository.findById(id);
    }

    @Override
    public Service save(Service service) {
        return repository.save(service);
    }
}

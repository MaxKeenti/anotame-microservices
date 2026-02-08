package com.anotame.catalog.application.port.output;

import com.anotame.catalog.domain.model.Service;
import java.util.List;
import java.util.Optional;

import java.util.UUID;

public interface ServiceRepositoryPort {
    List<Service> findAllActive();

    Optional<Service> findById(UUID id);

    Service save(Service service);

    void delete(UUID id);
}

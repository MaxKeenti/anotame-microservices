package com.anotame.catalog.application.service;

import com.anotame.catalog.application.port.output.GarmentRepositoryPort;
import com.anotame.catalog.application.port.output.ServiceRepositoryPort;
import com.anotame.catalog.domain.model.GarmentType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final GarmentRepositoryPort garmentRepository;
    private final ServiceRepositoryPort serviceRepository;

    public List<GarmentType> getAllGarments() {
        return garmentRepository.findAllActive();
    }

    public List<com.anotame.catalog.domain.model.Service> getAllServices() {
        return serviceRepository.findAllActive();
    }

    // Future: Add filtering, creation, etc.
}

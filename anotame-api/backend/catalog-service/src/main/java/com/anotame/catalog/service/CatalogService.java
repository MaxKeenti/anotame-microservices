package com.anotame.catalog.service;

import com.anotame.catalog.model.GarmentType;
import com.anotame.catalog.repository.GarmentTypeRepository;
import com.anotame.catalog.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final GarmentTypeRepository garmentTypeRepository;
    private final ServiceRepository serviceRepository;

    public List<GarmentType> getAllGarments() {
        return garmentTypeRepository.findByActiveTrue();
    }

    public List<com.anotame.catalog.model.Service> getAllServices() {
        return serviceRepository.findByActiveTrue();
    }

    // Future: Add filtering, creation, etc.
}

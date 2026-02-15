package com.anotame.catalog.application.service;

import com.anotame.catalog.application.port.output.GarmentRepositoryPort;
import com.anotame.catalog.application.port.output.ServiceRepositoryPort;
import com.anotame.catalog.domain.model.GarmentType;
import com.anotame.catalog.dto.GarmentTypeRequest;
import com.anotame.catalog.dto.ServiceRequest;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class CatalogService {

    private final GarmentRepositoryPort garmentRepository;
    private final ServiceRepositoryPort serviceRepository;

    public CatalogService(GarmentRepositoryPort garmentRepository, ServiceRepositoryPort serviceRepository) {
        this.garmentRepository = garmentRepository;
        this.serviceRepository = serviceRepository;
    }

    public List<GarmentType> getAllGarments() {
        return garmentRepository.findAllActive();
    }

    public List<com.anotame.catalog.domain.model.Service> getAllServices() {
        return serviceRepository.findAllActive();
    }

    // --- Garments ---

    public GarmentType createGarment(GarmentTypeRequest request) {
        GarmentType garment = new GarmentType();
        garment.setName(request.getName());
        garment.setDescription(request.getDescription());
        garment.setActive(true);
        return garmentRepository.save(garment);
    }

    public GarmentType updateGarment(UUID id, GarmentTypeRequest request) {
        return garmentRepository.findById(id).map(garment -> {
            garment.setName(request.getName());
            garment.setDescription(request.getDescription());
            return garmentRepository.save(garment);
        }).orElseThrow(() -> new RuntimeException("Garment not found"));
    }

    public void deleteGarment(UUID id) {
        garmentRepository.delete(id);
    }

    // --- Services ---

    public com.anotame.catalog.domain.model.Service createService(ServiceRequest request) {
        com.anotame.catalog.domain.model.Service service = new com.anotame.catalog.domain.model.Service();

        service.setName(request.getName());
        service.setDescription(request.getDescription());
        service.setDefaultDurationMin(request.getDefaultDurationMin());
        service.setBasePrice(request.getBasePrice());
        service.setActive(true);

        if (request.getGarmentTypeId() != null) {
            GarmentType garmentType = garmentRepository.findById(request.getGarmentTypeId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Garment Type not found: " + request.getGarmentTypeId()));
            service.setGarmentType(garmentType);
        }

        return serviceRepository.save(service);
    }

    public com.anotame.catalog.domain.model.Service updateService(UUID id, ServiceRequest request) {
        return serviceRepository.findById(id).map(service -> {
            service.setName(request.getName());
            service.setDescription(request.getDescription());
            service.setDefaultDurationMin(request.getDefaultDurationMin());
            service.setBasePrice(request.getBasePrice());

            if (request.getGarmentTypeId() != null) {
                GarmentType garmentType = garmentRepository.findById(request.getGarmentTypeId())
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Garment Type not found: " + request.getGarmentTypeId()));
                service.setGarmentType(garmentType);
            }

            return serviceRepository.save(service);
        }).orElseThrow(() -> new RuntimeException("Service not found"));
    }

    public void deleteService(UUID id) {
        serviceRepository.delete(id);
    }
}

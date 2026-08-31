package com.anotame.catalog.application.service;

import com.anotame.catalog.application.port.output.GarmentRepositoryPort;
import com.anotame.catalog.application.port.output.ServiceRepositoryPort;
import com.anotame.catalog.domain.exception.CatalogConflictException;
import com.anotame.catalog.domain.exception.CatalogNotFoundException;
import com.anotame.catalog.domain.model.GarmentType;
import com.anotame.catalog.application.dto.GarmentTypeRequest;
import com.anotame.catalog.application.dto.ServiceRequest;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

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
        requireUniqueGarmentName(request.getName(), null);
        GarmentType garment = new GarmentType();
        garment.setName(normalize(request.getName()));
        garment.setDescription(normalize(request.getDescription()));
        garment.setActive(true);
        return garmentRepository.save(garment);
    }

    @Transactional
    public GarmentType updateGarment(UUID id, GarmentTypeRequest request) {
        return garmentRepository.findById(id).map(garment -> {
            requireUniqueGarmentName(request.getName(), id);
            garment.setName(normalize(request.getName()));
            garment.setDescription(normalize(request.getDescription()));
            return garmentRepository.save(garment);
        }).orElseThrow(() -> new CatalogNotFoundException("Garment"));
    }

    /**
     * Names arrive from free-text inputs, and an untrimmed one creates a row that is
     * indistinguishable from its trimmed twin in every picker while slipping past both
     * the uniqueness check below and the V5 unique index on services.
     */
    private static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /**
     * Garment names have no database-level unique index (unlike services, see V5), so
     * duplicates are rejected here. Scoped to active garments so a name freed by a
     * deactivated garment can be reused.
     */
    private void requireUniqueGarmentName(String name, UUID selfId) {
        if (name == null || name.isBlank()) {
            return;
        }
        garmentRepository.findActiveByName(name).ifPresent(existing -> {
            if (selfId == null || !selfId.equals(existing.getId())) {
                throw new CatalogConflictException("A garment type named '" + name.trim() + "' already exists");
            }
        });
    }

    public void deleteGarment(UUID id) {
        garmentRepository.delete(id);
    }

    // --- Services ---

    public com.anotame.catalog.domain.model.Service createService(ServiceRequest request) {
        com.anotame.catalog.domain.model.Service service = new com.anotame.catalog.domain.model.Service();

        service.setName(normalize(request.getName()));
        service.setDescription(normalize(request.getDescription()));
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

    @Transactional
    public com.anotame.catalog.domain.model.Service updateService(UUID id, ServiceRequest request) {
        return serviceRepository.findById(id).map(service -> {
            service.setName(normalize(request.getName()));
            service.setDescription(normalize(request.getDescription()));
            service.setDefaultDurationMin(request.getDefaultDurationMin());
            service.setBasePrice(request.getBasePrice());

            if (request.getGarmentTypeId() != null) {
                GarmentType garmentType = garmentRepository.findById(request.getGarmentTypeId())
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Garment Type not found: " + request.getGarmentTypeId()));
                service.setGarmentType(garmentType);
            }

            return serviceRepository.save(service);
        }).orElseThrow(() -> new CatalogNotFoundException("Service"));
    }

    public void deleteService(UUID id) {
        serviceRepository.delete(id);
    }
}

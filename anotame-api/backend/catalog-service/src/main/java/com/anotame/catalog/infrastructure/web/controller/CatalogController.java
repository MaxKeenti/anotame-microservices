package com.anotame.catalog.infrastructure.web.controller;

import com.anotame.catalog.dto.GarmentTypeResponse;
import com.anotame.catalog.dto.ServiceResponse;
import com.anotame.catalog.application.service.CatalogService;
import com.anotame.catalog.domain.model.GarmentType;
import com.anotame.catalog.domain.model.Service;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import java.util.stream.Collectors;

import com.anotame.catalog.infrastructure.persistence.repository.PriceListItemRepository;

@Path("/catalog")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CatalogController {

    private final CatalogService catalogService;
    private final PriceListItemRepository priceListItemRepository;

    public CatalogController(CatalogService catalogService, PriceListItemRepository priceListItemRepository) {
        this.catalogService = catalogService;
        this.priceListItemRepository = priceListItemRepository;
    }

    @GET
    @Path("/garments")
    public List<GarmentTypeResponse> getGarments() {
        return catalogService.getAllGarments().stream()
                .map(this::mapToGarmentDto)
                .collect(Collectors.toList());
    }

    @GET
    @Path("/services")
    public List<ServiceResponse> getServices() {
        List<ServiceResponse> services = catalogService.getAllServices().stream()
                .map(this::mapToServiceDto)
                .collect(Collectors.toList());

        // Calculate effective prices
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        List<com.anotame.catalog.domain.model.PriceListItem> overrides = priceListItemRepository
                .findActiveOverrides(now);

        for (ServiceResponse service : services) {
            // Default to base price
            service.setEffectivePrice(service.getBasePrice());

            // Find first override (highest priority)
            for (com.anotame.catalog.domain.model.PriceListItem item : overrides) {
                if (item.getService().getId().equals(service.getId())) {
                    service.setEffectivePrice(item.getPrice());
                    break; // Priority sort ensures first match is winner
                }
            }
        }

        return services;
    }

    // --- Garments ---

    @POST
    @Path("/garments")
    public GarmentTypeResponse createGarment(com.anotame.catalog.dto.GarmentTypeRequest request) {
        GarmentType created = catalogService.createGarment(request);
        return mapToGarmentDto(created);
    }

    @PUT
    @Path("/garments/{id}")
    public GarmentTypeResponse updateGarment(@PathParam("id") java.util.UUID id,
            com.anotame.catalog.dto.GarmentTypeRequest request) {
        GarmentType updated = catalogService.updateGarment(id, request);
        return mapToGarmentDto(updated);
    }

    @DELETE
    @Path("/garments/{id}")
    public void deleteGarment(@PathParam("id") java.util.UUID id) {
        catalogService.deleteGarment(id);
    }

    // --- Services ---

    @POST
    @Path("/services")
    public ServiceResponse createService(com.anotame.catalog.dto.ServiceRequest request) {
        Service created = catalogService.createService(request);
        return mapToServiceDto(created);
    }

    @PUT
    @Path("/services/{id}")
    public ServiceResponse updateService(@PathParam("id") java.util.UUID id,
            com.anotame.catalog.dto.ServiceRequest request) {
        Service updated = catalogService.updateService(id, request);
        return mapToServiceDto(updated);
    }

    @DELETE
    @Path("/services/{id}")
    public void deleteService(@PathParam("id") java.util.UUID id) {
        catalogService.deleteService(id);
    }

    // Simple Mappers
    private GarmentTypeResponse mapToGarmentDto(GarmentType entity) {
        GarmentTypeResponse dto = new GarmentTypeResponse();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        return dto;
    }

    private ServiceResponse mapToServiceDto(Service entity) {
        ServiceResponse dto = new ServiceResponse();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setDefaultDurationMin(entity.getDefaultDurationMin());
        dto.setBasePrice(entity.getBasePrice());
        if (entity.getGarmentType() != null) {
            dto.setGarmentTypeId(entity.getGarmentType().getId());
        }
        return dto;
    }
}

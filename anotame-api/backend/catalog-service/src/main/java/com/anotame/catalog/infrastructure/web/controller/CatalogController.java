package com.anotame.catalog.infrastructure.web.controller;

import com.anotame.catalog.dto.GarmentTypeResponse;
import com.anotame.catalog.dto.ServiceResponse;
import com.anotame.catalog.application.service.CatalogService;
import com.anotame.catalog.domain.model.GarmentType;
import com.anotame.catalog.domain.model.Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    @GetMapping("/garments")
    public ResponseEntity<List<GarmentTypeResponse>> getGarments() {
        List<GarmentType> garments = catalogService.getAllGarments();
        List<GarmentTypeResponse> response = garments.stream()
                .map(this::mapToGarmentDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/services")
    public ResponseEntity<List<ServiceResponse>> getServices() {
        List<Service> services = catalogService.getAllServices();
        List<ServiceResponse> response = services.stream()
                .map(this::mapToServiceDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    // Simple Mappers (Can be replaced by MapStruct later)
    private GarmentTypeResponse mapToGarmentDto(GarmentType entity) {
        GarmentTypeResponse dto = new GarmentTypeResponse();
        dto.setId(entity.getId());
        dto.setCode(entity.getCode());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        return dto;
    }

    private ServiceResponse mapToServiceDto(Service entity) {
        ServiceResponse dto = new ServiceResponse();
        dto.setId(entity.getId());
        dto.setCode(entity.getCode());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setDefaultDurationMin(entity.getDefaultDurationMin());
        dto.setBasePrice(entity.getBasePrice());
        return dto;
    }
}

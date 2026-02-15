package com.anotame.catalog.application.service;

import com.anotame.catalog.domain.model.PriceList;
import com.anotame.catalog.domain.model.PriceListItem;
import com.anotame.catalog.domain.model.Service;
import com.anotame.catalog.dto.*;
import com.anotame.catalog.infrastructure.persistence.repository.PriceListItemRepository;
import com.anotame.catalog.infrastructure.persistence.repository.PriceListRepository;
import com.anotame.catalog.infrastructure.persistence.repository.ServiceRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@ApplicationScoped
public class PriceListService {

    @Inject
    PriceListRepository priceListRepository;

    @Inject
    PriceListItemRepository priceListItemRepository;

    @Inject
    ServiceRepository serviceRepository;

    @Transactional
    public PriceListResponse create(PriceListRequest request) {
        PriceList list = new PriceList();
        list.setName(request.getName());
        list.setValidFrom(request.getValidFrom());
        list.setValidTo(request.getValidTo());
        list.setActive(request.isActive());
        list.setPriority(request.getPriority());

        priceListRepository.persist(list);

        // Process initial items if any
        if (request.getItems() != null) {
            for (PriceListRequest.ItemRequest itemReq : request.getItems()) {
                Service service = serviceRepository.findById(itemReq.getServiceId());
                if (service != null) {
                    PriceListItem item = new PriceListItem();
                    item.setService(service);
                    item.setPrice(itemReq.getPrice());
                    list.addItem(item); // helper handles bi-directional
                }
            }
        }

        return mapToResponse(list);
    }

    public PricingCalculationResponse calculatePrice(PricingCalculationRequest request) {
        LocalDateTime date = request.getDate() != null ? request.getDate() : LocalDateTime.now();
        Service service = serviceRepository.findById(request.getServiceId());

        if (service == null) {
            throw new NotFoundException("Service not found");
        }

        PricingCalculationResponse response = new PricingCalculationResponse();
        response.setServiceId(service.getId());

        // Strategy: Check for override
        PriceListItem effectiveItem = priceListItemRepository.findEffectiveItem(service.getId(), date);

        if (effectiveItem != null) {
            response.setFinalPrice(effectiveItem.getPrice());
            response.setSource(effectiveItem.getPriceList().getName());
            response.setPriceListId(effectiveItem.getPriceList().getId());
        } else {
            response.setFinalPrice(service.getBasePrice());
            response.setSource("BASE_PRICE");
            response.setPriceListId(null);
        }

        return response;
    }

    public List<PriceListResponse> getAll() {
        return priceListRepository.listAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public PriceListResponse getById(UUID id) {
        PriceList list = priceListRepository.findById(id);
        if (list == null)
            throw new NotFoundException();
        return mapToResponse(list);
    }

    @Transactional
    public PriceListResponse update(UUID id, PriceListRequest request) {
        PriceList list = priceListRepository.findById(id);
        if (list == null) {
            throw new NotFoundException("PriceList not found");
        }

        // Update fields
        list.setName(request.getName());
        list.setValidFrom(request.getValidFrom());
        list.setValidTo(request.getValidTo());
        list.setActive(request.isActive());
        list.setPriority(request.getPriority());

        // Update items (Full Replacement Strategy for simplicity)
        // Clear existing items
        list.getItems().clear();

        // Add new items
        if (request.getItems() != null) {
            for (PriceListRequest.ItemRequest itemReq : request.getItems()) {
                Service service = serviceRepository.findById(itemReq.getServiceId());
                if (service != null) {
                    PriceListItem item = new PriceListItem();
                    item.setService(service);
                    item.setPrice(itemReq.getPrice());
                    list.addItem(item);
                }
            }
        }

        // Persist happens automatically at transaction end
        return mapToResponse(list);
    }

    @Transactional
    public void delete(UUID id) {
        // Soft delete handled by entity annotation?
        // Logic says @SQLDelete handles the physical SQL generation, but Hibernate
        // delete() call triggers it.
        priceListRepository.deleteById(id);
    }

    // Mapping Helper
    private PriceListResponse mapToResponse(PriceList list) {
        PriceListResponse res = new PriceListResponse();
        res.setId(list.getId());
        res.setName(list.getName());
        res.setValidFrom(list.getValidFrom());
        res.setValidTo(list.getValidTo());
        res.setActive(list.isActive());
        res.setPriority(list.getPriority());

        if (list.getItems() != null) {
            res.setItems(list.getItems().stream().map(item -> {
                PriceListItemDto dto = new PriceListItemDto();
                dto.setServiceId(item.getService().getId());
                dto.setServiceName(item.getService().getName());
                dto.setPrice(item.getPrice());
                dto.setBasePrice(item.getService().getBasePrice());
                return dto;
            }).collect(Collectors.toList()));
        }

        return res;
    }
}

package com.anotame.catalog.application.service;

import com.anotame.catalog.application.dto.PriceListItemDto;
import com.anotame.catalog.application.dto.PriceListRequest;
import com.anotame.catalog.application.dto.PriceListResponse;
import com.anotame.catalog.application.dto.PricingCalculationRequest;
import com.anotame.catalog.application.dto.PricingCalculationResponse;
import com.anotame.catalog.application.port.output.PriceListItemRepositoryPort;
import com.anotame.catalog.application.port.output.PriceListRepositoryPort;
import com.anotame.catalog.application.port.output.ServiceRepositoryPort;
import com.anotame.catalog.domain.exception.CatalogNotFoundException;
import com.anotame.catalog.domain.model.PriceList;
import com.anotame.catalog.domain.model.PriceListItem;
import com.anotame.catalog.domain.model.Service;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class PriceListService {

    private final PriceListRepositoryPort priceListRepository;
    private final PriceListItemRepositoryPort priceListItemRepository;
    private final ServiceRepositoryPort serviceRepository;

    public PriceListService(
            PriceListRepositoryPort priceListRepository,
            PriceListItemRepositoryPort priceListItemRepository,
            ServiceRepositoryPort serviceRepository) {
        this.priceListRepository = priceListRepository;
        this.priceListItemRepository = priceListItemRepository;
        this.serviceRepository = serviceRepository;
    }

    @Transactional
    public PriceListResponse create(PriceListRequest request) {
        PriceList list = new PriceList();
        list.setName(request.getName());
        list.setValidFrom(request.getValidFrom());
        list.setValidTo(request.getValidTo());
        list.setActive(request.isActive());
        list.setPriority(request.getPriority());

        if (request.getItems() != null) {
            for (PriceListRequest.ItemRequest itemReq : request.getItems()) {
                Service service = serviceRepository.findById(itemReq.getServiceId())
                        .orElseThrow(() -> new CatalogNotFoundException("Service"));
                PriceListItem item = new PriceListItem();
                item.setService(service);
                item.setPrice(itemReq.getPrice());
                list.addItem(item);
            }
        }

        return mapToResponse(priceListRepository.save(list));
    }

    public PricingCalculationResponse calculatePrice(PricingCalculationRequest request) {
        LocalDateTime date = request.getDate() != null ? request.getDate() : LocalDateTime.now();
        Service service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new CatalogNotFoundException("Service"));

        PricingCalculationResponse response = new PricingCalculationResponse();
        response.setServiceId(service.getId());

        priceListItemRepository.findEffectiveItem(service.getId(), date).ifPresentOrElse(effectiveItem -> {
            response.setFinalPrice(effectiveItem.getPrice());
            response.setSource(effectiveItem.getPriceList().getName());
            response.setPriceListId(effectiveItem.getPriceList().getId());
        }, () -> {
            response.setFinalPrice(service.getBasePrice());
            response.setSource("BASE_PRICE");
            response.setPriceListId(null);
        });

        return response;
    }

    public List<PriceListResponse> getAll() {
        return priceListRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    public PriceListResponse getById(UUID id) {
        PriceList list = priceListRepository.findById(id)
                .orElseThrow(() -> new CatalogNotFoundException("PriceList"));
        return mapToResponse(list);
    }

    @Transactional
    public PriceListResponse update(UUID id, PriceListRequest request) {
        PriceList list = priceListRepository.findById(id)
                .orElseThrow(() -> new CatalogNotFoundException("PriceList"));

        list.setName(request.getName());
        list.setValidFrom(request.getValidFrom());
        list.setValidTo(request.getValidTo());
        list.setActive(request.isActive());
        list.setPriority(request.getPriority());

        list.getItems().clear();

        if (request.getItems() != null) {
            for (PriceListRequest.ItemRequest itemReq : request.getItems()) {
                Service service = serviceRepository.findById(itemReq.getServiceId())
                        .orElseThrow(() -> new CatalogNotFoundException("Service"));
                PriceListItem item = new PriceListItem();
                item.setService(service);
                item.setPrice(itemReq.getPrice());
                list.addItem(item);
            }
        }

        return mapToResponse(priceListRepository.save(list));
    }

    @Transactional
    public void delete(UUID id) {
        priceListRepository.deleteById(id);
    }

    public List<PriceListItem> getActiveOverrides(LocalDateTime date) {
        return priceListItemRepository.findActiveOverrides(date);
    }

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
            }).toList());
        }

        return res;
    }
}

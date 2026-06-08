package com.anotame.catalog.infrastructure.persistence.adapter;

import com.anotame.catalog.domain.model.GarmentType;
import com.anotame.catalog.domain.model.PriceList;
import com.anotame.catalog.domain.model.PriceListItem;
import com.anotame.catalog.domain.model.Service;
import com.anotame.catalog.infrastructure.persistence.entity.GarmentTypeEntity;
import com.anotame.catalog.infrastructure.persistence.entity.PriceListEntity;
import com.anotame.catalog.infrastructure.persistence.entity.PriceListItemEntity;
import com.anotame.catalog.infrastructure.persistence.entity.ServiceEntity;

final class CatalogPersistenceMapper {

    private CatalogPersistenceMapper() {
    }

    static GarmentType toDomain(GarmentTypeEntity entity) {
        if (entity == null) {
            return null;
        }
        GarmentType garmentType = new GarmentType();
        garmentType.setId(entity.getId());
        garmentType.setName(entity.getName());
        garmentType.setDescription(entity.getDescription());
        garmentType.setActive(entity.isActive());
        garmentType.setCreatedAt(entity.getCreatedAt());
        garmentType.setUpdatedAt(entity.getUpdatedAt());
        garmentType.setDeletedAt(entity.getDeletedAt());
        garmentType.setDeleted(entity.isDeleted());
        return garmentType;
    }

    static Service toDomain(ServiceEntity entity) {
        if (entity == null) {
            return null;
        }
        Service service = new Service();
        service.setId(entity.getId());
        service.setName(entity.getName());
        service.setDescription(entity.getDescription());
        service.setDefaultDurationMin(entity.getDefaultDurationMin());
        service.setBasePrice(entity.getBasePrice());
        service.setActive(entity.isActive());
        service.setGarmentType(toDomain(entity.getGarmentType()));
        service.setCreatedAt(entity.getCreatedAt());
        service.setUpdatedAt(entity.getUpdatedAt());
        service.setDeletedAt(entity.getDeletedAt());
        service.setDeleted(entity.isDeleted());
        return service;
    }

    static PriceList toDomain(PriceListEntity entity) {
        if (entity == null) {
            return null;
        }
        PriceList priceList = toDomainSummary(entity);
        if (entity.getItems() != null) {
            entity.getItems().stream()
                    .map(item -> toDomain(item, false))
                    .forEach(priceList::addItem);
        }
        return priceList;
    }

    static PriceListItem toDomain(PriceListItemEntity entity) {
        return toDomain(entity, true);
    }

    static void apply(GarmentTypeEntity entity, GarmentType domain) {
        entity.setName(domain.getName());
        entity.setDescription(domain.getDescription());
        entity.setActive(domain.isActive());
        entity.setDeleted(domain.isDeleted());
        entity.setDeletedAt(domain.getDeletedAt());
    }

    static void apply(ServiceEntity entity, Service domain, GarmentTypeEntity garmentType) {
        entity.setName(domain.getName());
        entity.setDescription(domain.getDescription());
        entity.setDefaultDurationMin(domain.getDefaultDurationMin());
        entity.setBasePrice(domain.getBasePrice());
        entity.setActive(domain.isActive());
        entity.setGarmentType(garmentType);
        entity.setDeleted(domain.isDeleted());
        entity.setDeletedAt(domain.getDeletedAt());
    }

    static void apply(PriceListEntity entity, PriceList domain) {
        entity.setName(domain.getName());
        entity.setValidFrom(domain.getValidFrom());
        entity.setValidTo(domain.getValidTo());
        entity.setActive(domain.isActive());
        entity.setPriority(domain.getPriority());
        entity.setDeleted(domain.isDeleted());
        entity.setDeletedAt(domain.getDeletedAt());
    }

    private static PriceListItem toDomain(PriceListItemEntity entity, boolean includePriceList) {
        if (entity == null) {
            return null;
        }
        PriceListItem item = new PriceListItem();
        item.setId(entity.getId());
        item.setService(toDomain(entity.getService()));
        item.setPrice(entity.getPrice());
        item.setCreatedAt(entity.getCreatedAt());
        item.setUpdatedAt(entity.getUpdatedAt());
        if (includePriceList) {
            item.setPriceList(toDomainSummary(entity.getPriceList()));
        }
        return item;
    }

    private static PriceList toDomainSummary(PriceListEntity entity) {
        if (entity == null) {
            return null;
        }
        PriceList priceList = new PriceList();
        priceList.setId(entity.getId());
        priceList.setName(entity.getName());
        priceList.setValidFrom(entity.getValidFrom());
        priceList.setValidTo(entity.getValidTo());
        priceList.setActive(entity.isActive());
        priceList.setPriority(entity.getPriority());
        priceList.setCreatedAt(entity.getCreatedAt());
        priceList.setUpdatedAt(entity.getUpdatedAt());
        priceList.setDeleted(entity.isDeleted());
        priceList.setDeletedAt(entity.getDeletedAt());
        return priceList;
    }
}

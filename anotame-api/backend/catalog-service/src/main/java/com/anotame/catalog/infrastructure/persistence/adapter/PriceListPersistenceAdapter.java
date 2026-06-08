package com.anotame.catalog.infrastructure.persistence.adapter;

import com.anotame.catalog.application.port.output.PriceListRepositoryPort;
import com.anotame.catalog.domain.model.PriceList;
import com.anotame.catalog.domain.model.PriceListItem;
import com.anotame.catalog.domain.model.Service;
import com.anotame.catalog.infrastructure.persistence.entity.PriceListEntity;
import com.anotame.catalog.infrastructure.persistence.entity.PriceListItemEntity;
import com.anotame.catalog.infrastructure.persistence.entity.ServiceEntity;
import com.anotame.catalog.infrastructure.persistence.repository.PriceListRepository;
import com.anotame.catalog.infrastructure.persistence.repository.ServiceRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class PriceListPersistenceAdapter implements PriceListRepositoryPort {

    private final PriceListRepository repository;
    private final ServiceRepository serviceRepository;

    public PriceListPersistenceAdapter(PriceListRepository repository, ServiceRepository serviceRepository) {
        this.repository = repository;
        this.serviceRepository = serviceRepository;
    }

    @Override
    @Transactional
    public List<PriceList> findAll() {
        return repository.listAll().stream()
                .map(CatalogPersistenceMapper::toDomain)
                .toList();
    }

    @Override
    @Transactional
    public Optional<PriceList> findById(UUID id) {
        if (id == null) {
            return Optional.empty();
        }
        return repository.findByIdOptional(id)
                .map(CatalogPersistenceMapper::toDomain);
    }

    @Override
    @Transactional
    public PriceList save(PriceList priceList) {
        if (priceList == null) {
            return null;
        }
        PriceListEntity entity = priceList.getId() == null
                ? new PriceListEntity()
                : repository.findByIdOptional(priceList.getId())
                        .orElseThrow(() -> new IllegalStateException("Price list not found: " + priceList.getId()));

        CatalogPersistenceMapper.apply(entity, priceList);
        syncItems(entity, priceList);

        if (entity.getId() == null) {
            repository.persist(entity);
        }

        return CatalogPersistenceMapper.toDomain(entity);
    }

    @Override
    @Transactional
    public boolean deleteById(UUID id) {
        if (id == null) {
            return false;
        }
        return repository.deleteById(id);
    }

    private void syncItems(PriceListEntity entity, PriceList priceList) {
        entity.getItems().clear();
        if (priceList.getItems() == null) {
            return;
        }
        for (PriceListItem item : priceList.getItems()) {
            PriceListItemEntity itemEntity = new PriceListItemEntity();
            itemEntity.setService(findServiceEntity(item.getService()));
            itemEntity.setPrice(item.getPrice());
            entity.addItem(itemEntity);
        }
    }

    private ServiceEntity findServiceEntity(Service service) {
        if (service == null || service.getId() == null) {
            throw new IllegalStateException("Service id is required");
        }
        return serviceRepository.findByIdOptional(service.getId())
                .orElseThrow(() -> new IllegalStateException("Service not found: " + service.getId()));
    }
}

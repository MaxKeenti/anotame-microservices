package com.anotame.catalog.infrastructure.persistence.adapter;

import com.anotame.catalog.application.port.output.PriceListRepositoryPort;
import com.anotame.catalog.domain.model.PriceList;
import com.anotame.catalog.infrastructure.persistence.repository.PriceListRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class PriceListPersistenceAdapter implements PriceListRepositoryPort {

    private final PriceListRepository repository;

    public PriceListPersistenceAdapter(PriceListRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<PriceList> findAll() {
        return repository.listAll();
    }

    @Override
    public Optional<PriceList> findById(UUID id) {
        if (id == null) {
            return Optional.empty();
        }
        return repository.findByIdOptional(id);
    }

    @Override
    @Transactional
    public PriceList save(PriceList priceList) {
        if (priceList == null) {
            return null;
        }
        if (priceList.getId() == null) {
            repository.persist(priceList);
        }
        return priceList;
    }

    @Override
    @Transactional
    public boolean deleteById(UUID id) {
        if (id == null) {
            return false;
        }
        return repository.deleteById(id);
    }
}

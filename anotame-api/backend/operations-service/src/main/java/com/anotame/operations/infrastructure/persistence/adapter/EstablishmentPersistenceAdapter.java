package com.anotame.operations.infrastructure.persistence.adapter;

import com.anotame.operations.application.port.output.EstablishmentRepositoryPort;
import com.anotame.operations.domain.model.Establishment;
import com.anotame.operations.infrastructure.persistence.entity.EstablishmentEntity;
import com.anotame.operations.infrastructure.persistence.repository.EstablishmentRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import java.util.Optional;

@ApplicationScoped
public class EstablishmentPersistenceAdapter implements EstablishmentRepositoryPort {

    private final EstablishmentRepository repository;

    public EstablishmentPersistenceAdapter(EstablishmentRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<Establishment> getEstablishment() {
        return repository.findAll().firstResultOptional()
                .map(this::toDomain);
    }

    @Override
    @Transactional
    public Establishment save(Establishment establishment) {
        EstablishmentEntity entity;
        if (establishment.getId() != null) {
            entity = repository.findById(establishment.getId());
        } else {
            Optional<EstablishmentEntity> existing = repository.findAll().firstResultOptional();
            entity = existing.orElse(new EstablishmentEntity());
        }

        if (entity == null) {
            entity = new EstablishmentEntity();
        }

        entity.setName(establishment.getName());
        entity.setOwnerName(establishment.getOwnerName());
        entity.setTaxInfo(establishment.getTaxInfo());
        entity.setActive(establishment.isActive());
        entity.setDailyCapacityMinutes(establishment.getDailyCapacityMinutes());
        entity.setPrimaryColor(establishment.getPrimaryColor());
        entity.setFontFamily(establishment.getFontFamily());
        entity.setCapacityThresholdGreen(establishment.getCapacityThresholdGreen());
        entity.setCapacityThresholdAmber(establishment.getCapacityThresholdAmber());
        entity.setAtRiskDaysThreshold(establishment.getAtRiskDaysThreshold());

        repository.persist(entity);
        return toDomain(entity);
    }

    private Establishment toDomain(EstablishmentEntity entity) {
        Establishment domain = new Establishment();
        domain.setId(entity.getId());
        domain.setName(entity.getName());
        domain.setOwnerName(entity.getOwnerName());
        domain.setTaxInfo(entity.getTaxInfo());
        domain.setActive(entity.isActive());
        domain.setDailyCapacityMinutes(entity.getDailyCapacityMinutes());
        domain.setPrimaryColor(entity.getPrimaryColor());
        domain.setFontFamily(entity.getFontFamily());
        domain.setCapacityThresholdGreen(entity.getCapacityThresholdGreen());
        domain.setCapacityThresholdAmber(entity.getCapacityThresholdAmber());
        domain.setAtRiskDaysThreshold(entity.getAtRiskDaysThreshold());
        return domain;
    }
}

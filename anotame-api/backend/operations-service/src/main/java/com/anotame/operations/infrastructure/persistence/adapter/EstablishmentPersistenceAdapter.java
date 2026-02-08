package com.anotame.operations.infrastructure.persistence.adapter;

import com.anotame.operations.application.port.output.EstablishmentRepositoryPort;
import com.anotame.operations.domain.model.Establishment;
import com.anotame.operations.infrastructure.persistence.entity.EstablishmentJpa;
import com.anotame.operations.infrastructure.persistence.repository.EstablishmentRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.Optional;

@ApplicationScoped
public class EstablishmentPersistenceAdapter implements EstablishmentRepositoryPort {

    @Inject
    EstablishmentRepository repository;

    @Override
    public Optional<Establishment> getEstablishment() {
        return repository.findAll().firstResultOptional()
                .map(this::toDomain);
    }

    @Override
    @Transactional
    public Establishment save(Establishment establishment) {
        EstablishmentJpa entity;
        if (establishment.getId() != null) {
            entity = repository.findById(establishment.getId());
        } else {
            // Attempt to find existing one to enforce singleton-ish behavior per branch
            // design
            // For now just get first or create
            Optional<EstablishmentJpa> existing = repository.findAll().firstResultOptional();
            entity = existing.orElse(new EstablishmentJpa());
        }

        if (entity == null)
            entity = new EstablishmentJpa();

        entity.setName(establishment.getName());
        entity.setOwnerName(establishment.getOwnerName());
        entity.setTaxInfo(establishment.getTaxInfo());
        entity.setActive(establishment.isActive());

        repository.persist(entity);
        return toDomain(entity);
    }

    private Establishment toDomain(EstablishmentJpa entity) {
        Establishment domain = new Establishment();
        domain.setId(entity.getId());
        domain.setName(entity.getName());
        domain.setOwnerName(entity.getOwnerName());
        domain.setTaxInfo(entity.getTaxInfo());
        domain.setActive(entity.isActive());
        return domain;
    }
}

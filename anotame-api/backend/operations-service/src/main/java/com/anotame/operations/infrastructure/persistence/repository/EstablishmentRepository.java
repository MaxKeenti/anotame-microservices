package com.anotame.operations.infrastructure.persistence.repository;

import com.anotame.operations.infrastructure.persistence.entity.EstablishmentEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.UUID;

@ApplicationScoped
public class EstablishmentRepository implements PanacheRepositoryBase<EstablishmentEntity, UUID> {
}

package com.anotame.catalog.infrastructure.persistence.repository;

import com.anotame.catalog.domain.model.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ServiceRepository extends JpaRepository<Service, UUID> {
    List<Service> findByActiveTrue();

    boolean existsByCode(String code);
}

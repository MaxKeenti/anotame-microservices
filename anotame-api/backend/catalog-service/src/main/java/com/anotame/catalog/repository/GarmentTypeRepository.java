package com.anotame.catalog.repository;

import com.anotame.catalog.model.GarmentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GarmentTypeRepository extends JpaRepository<GarmentType, UUID> {
    List<GarmentType> findByActiveTrue();

    boolean existsByCode(String code);
}

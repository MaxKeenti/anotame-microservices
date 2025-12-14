package com.anotame.sales.infrastructure.persistence.repository;

import com.anotame.sales.domain.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

@Repository
public interface CustomerJpaRepository extends JpaRepository<Customer, UUID> {

    @Query("SELECT c FROM Customer c WHERE " +
            "LOWER(c.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "c.phoneNumber LIKE CONCAT('%', :query, '%') OR " +
            "LOWER(c.email) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Customer> search(String query);

    Optional<Customer> findByEmail(String email);

    Optional<Customer> findByPhoneNumber(String phoneNumber);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);
}

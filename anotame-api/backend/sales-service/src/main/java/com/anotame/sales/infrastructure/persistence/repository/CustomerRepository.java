package com.anotame.sales.infrastructure.persistence.repository;

import com.anotame.sales.infrastructure.persistence.entity.CustomerEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class CustomerRepository implements PanacheRepositoryBase<CustomerEntity, UUID> {

    public List<CustomerEntity> search(String query) {
        if (query == null) {
            query = "";
        }
        String q = "%" + query.toLowerCase() + "%";
        return list(
                "LOWER(firstName) LIKE ?1 OR LOWER(lastName) LIKE ?1 OR phoneNumber LIKE ?1 OR LOWER(email) LIKE ?1",
                q);
    }

    public Optional<CustomerEntity> findByEmail(String email) {
        return find("email", email).firstResultOptional();
    }

    public Optional<CustomerEntity> findByPhoneNumber(String phoneNumber) {
        return find("phoneNumber", phoneNumber).firstResultOptional();
    }
}

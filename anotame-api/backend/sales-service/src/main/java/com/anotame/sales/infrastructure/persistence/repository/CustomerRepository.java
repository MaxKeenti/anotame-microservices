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
        // Accent-insensitive: unaccent() (from the unaccent extension, enabled in V4)
        // is applied to both the column and the search term so "monica" matches
        // "Mónica" and vice versa. The parameter is unaccented in-DB too, so callers
        // can type either form.
        //
        // Both sides of each LIKE are wrapped in LOWER(): besides normalizing case, it
        // gives the unaccent() result a known String type. Hibernate can't infer the
        // return type of the custom unaccent() function, so a bare FUNCTION('unaccent',
        // ?1) on the right of a LIKE is treated as java.lang.Object and rejected with
        // "Operand of 'like' is of type 'java.lang.Object'".
        String q = "%" + query.toLowerCase() + "%";
        return list(
                "LOWER(FUNCTION('unaccent', firstName)) LIKE LOWER(FUNCTION('unaccent', ?1)) "
                        + "OR LOWER(FUNCTION('unaccent', lastName)) LIKE LOWER(FUNCTION('unaccent', ?1)) "
                        + "OR phoneNumber LIKE ?1 "
                        + "OR LOWER(FUNCTION('unaccent', email)) LIKE LOWER(FUNCTION('unaccent', ?1))",
                q);
    }

    public Optional<CustomerEntity> findByEmail(String email) {
        return find("email", email).firstResultOptional();
    }

    public Optional<CustomerEntity> findByPhoneNumber(String phoneNumber) {
        return find("phoneNumber", phoneNumber).firstResultOptional();
    }
}

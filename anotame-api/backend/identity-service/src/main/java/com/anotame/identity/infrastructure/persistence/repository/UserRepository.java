package com.anotame.identity.infrastructure.persistence.repository;

import com.anotame.identity.domain.model.User;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class UserRepository implements PanacheRepositoryBase<User, UUID> {

    @Inject
    EntityManager em;

    public Optional<User> findByUsername(String username) {
        return find("username", username).firstResultOptional();
    }

    public Optional<User> findByEmail(String email) {
        return find("email", email).firstResultOptional();
    }

    public boolean existsByUsername(String username) {
        return count("username", username) > 0;
    }

    public boolean existsByEmail(String email) {
        return count("email", email) > 0;
    }

    /**
     * Returns the active branch UUID for the given user, or null if no active
     * assignment exists. Uses a native query to avoid introducing a full entity
     * for the cross-context join table tce_employee_assignment.
     */
    public UUID findActiveBranchForUser(UUID userId) {
        try {
            Object result = em.createNativeQuery(
                    "SELECT id_branch FROM tce_employee_assignment " +
                            "WHERE id_user = :userId AND is_active = true LIMIT 1")
                    .setParameter("userId", userId)
                    .getSingleResult();
            return UUID.fromString(result.toString());
        } catch (Exception e) {
            // Broad catch for NoResultException or SQLGrammarException (isolated DB)
            return null;
        }
    }
}

package com.anotame.operations.infrastructure.persistence.repository;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class EmployeeAssignmentRepository {

    private final EntityManager entityManager;

    @SuppressWarnings("unchecked")
    public List<UUID> findActiveBranchIds(UUID userId) {
        return entityManager.createNativeQuery("""
                        SELECT id_branch
                        FROM tce_employee_assignment
                        WHERE id_user = :userId
                          AND is_active = true
                          AND (start_date IS NULL OR start_date <= CURRENT_DATE)
                          AND (end_date IS NULL OR end_date >= CURRENT_DATE)
                        ORDER BY start_date DESC NULLS LAST, id_assignment
                        """)
                .setParameter("userId", userId)
                .setMaxResults(2)
                .getResultList()
                .stream()
                .map(this::toUuid)
                .toList();
    }

    private UUID toUuid(Object value) {
        return value instanceof UUID uuid ? uuid : UUID.fromString(value.toString());
    }
}

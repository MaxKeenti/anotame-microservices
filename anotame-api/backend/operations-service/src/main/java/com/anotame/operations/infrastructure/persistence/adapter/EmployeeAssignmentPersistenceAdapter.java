package com.anotame.operations.infrastructure.persistence.adapter;

import com.anotame.operations.application.port.output.EmployeeAssignmentRepositoryPort;
import com.anotame.operations.infrastructure.persistence.repository.EmployeeAssignmentRepository;
import jakarta.enterprise.context.ApplicationScoped;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class EmployeeAssignmentPersistenceAdapter implements EmployeeAssignmentRepositoryPort {

    private final EmployeeAssignmentRepository repository;

    @Override
    public List<UUID> findActiveBranchIds(UUID userId) {
        return repository.findActiveBranchIds(userId);
    }
}

package com.anotame.operations.application.service;

import com.anotame.operations.application.port.output.EmployeeAssignmentRepositoryPort;
import com.anotame.operations.domain.exception.ActiveBranchNotFoundException;
import com.anotame.operations.domain.exception.AmbiguousActiveBranchException;
import jakarta.enterprise.context.ApplicationScoped;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class EmployeeAssignmentService {

    private final EmployeeAssignmentRepositoryPort repository;

    public UUID requireSingleActiveBranch(UUID userId) {
        List<UUID> branchIds = repository.findActiveBranchIds(userId);
        if (branchIds.isEmpty()) {
            throw new ActiveBranchNotFoundException(userId);
        }
        if (branchIds.size() > 1) {
            throw new AmbiguousActiveBranchException(userId);
        }
        return branchIds.getFirst();
    }
}

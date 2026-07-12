package com.anotame.operations.application.port.output;

import java.util.List;
import java.util.UUID;

public interface EmployeeAssignmentRepositoryPort {

    List<UUID> findActiveBranchIds(UUID userId);
}

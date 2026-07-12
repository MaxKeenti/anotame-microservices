package com.anotame.identity.application.port.output;

import java.util.UUID;

public interface BranchAssignmentPort {

    UUID requireActiveBranch(UUID userId);
}

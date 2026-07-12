package com.anotame.operations.domain.exception;

import java.util.UUID;

public class AmbiguousActiveBranchException extends RuntimeException {

    public AmbiguousActiveBranchException(UUID userId) {
        super("Multiple active branch assignments for user " + userId);
    }
}

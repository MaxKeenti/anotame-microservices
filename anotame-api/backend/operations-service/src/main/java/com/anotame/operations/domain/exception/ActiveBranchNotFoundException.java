package com.anotame.operations.domain.exception;

import java.util.UUID;

public class ActiveBranchNotFoundException extends RuntimeException {

    public ActiveBranchNotFoundException(UUID userId) {
        super("No active branch assignment for user " + userId);
    }
}

package com.anotame.identity.domain.exception;

public class BranchAssignmentRequiredException extends DomainException {

    public BranchAssignmentRequiredException() {
        super("An active branch assignment is required");
    }
}

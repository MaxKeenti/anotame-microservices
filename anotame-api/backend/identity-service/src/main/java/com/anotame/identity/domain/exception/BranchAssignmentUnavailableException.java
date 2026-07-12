package com.anotame.identity.domain.exception;

public class BranchAssignmentUnavailableException extends DomainException {

    public BranchAssignmentUnavailableException() {
        super("Branch assignment service is unavailable");
    }
}

package com.anotame.identity.domain.exception;

public class BranchAssignmentInvalidException extends DomainException {

    public BranchAssignmentInvalidException() {
        super("Multiple active branch assignments require resolution");
    }
}

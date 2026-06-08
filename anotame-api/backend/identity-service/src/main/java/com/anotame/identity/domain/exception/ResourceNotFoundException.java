package com.anotame.identity.domain.exception;

public class ResourceNotFoundException extends DomainException {
    public ResourceNotFoundException(String resource) {
        super(resource + " not found");
    }
}

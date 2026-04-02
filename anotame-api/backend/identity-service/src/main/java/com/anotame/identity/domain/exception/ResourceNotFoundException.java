package com.anotame.identity.domain.exception;

import jakarta.ws.rs.core.Response;

public class ResourceNotFoundException extends DomainException {
    public ResourceNotFoundException(String resource) {
        super(resource + " not found", Response.Status.NOT_FOUND);
    }
}

package com.anotame.identity.domain.exception;

import jakarta.ws.rs.core.Response;

public abstract class DomainException extends RuntimeException {

    private final Response.Status httpStatus;

    protected DomainException(String message, Response.Status status) {
        super(message);
        this.httpStatus = status;
    }

    public Response.Status getHttpStatus() {
        return httpStatus;
    }
}

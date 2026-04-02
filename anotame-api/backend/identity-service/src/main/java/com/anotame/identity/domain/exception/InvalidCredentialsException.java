package com.anotame.identity.domain.exception;

import jakarta.ws.rs.core.Response;

public class InvalidCredentialsException extends DomainException {
    public InvalidCredentialsException() {
        super("Invalid username or password", Response.Status.UNAUTHORIZED);
    }
}

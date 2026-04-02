package com.anotame.identity.domain.exception;

import jakarta.ws.rs.core.Response;

public class UserAlreadyExistsException extends DomainException {
    public UserAlreadyExistsException(String username) {
        super("Username already taken: " + username, Response.Status.CONFLICT);
    }
}

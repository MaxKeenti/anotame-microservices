package com.anotame.identity.domain.exception;

public class UserAlreadyExistsException extends DomainException {
    public UserAlreadyExistsException(String username) {
        super("Username already taken: " + username);
    }
}

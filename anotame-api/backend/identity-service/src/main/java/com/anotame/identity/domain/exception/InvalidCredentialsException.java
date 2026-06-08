package com.anotame.identity.domain.exception;

public class InvalidCredentialsException extends DomainException {
    public InvalidCredentialsException() {
        super("Invalid username or password");
    }
}

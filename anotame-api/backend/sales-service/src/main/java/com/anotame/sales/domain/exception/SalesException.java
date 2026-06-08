package com.anotame.sales.domain.exception;

public abstract class SalesException extends RuntimeException {

    protected SalesException(String message) {
        super(message);
    }
}

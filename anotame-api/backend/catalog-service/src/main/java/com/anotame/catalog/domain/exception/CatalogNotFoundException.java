package com.anotame.catalog.domain.exception;

public class CatalogNotFoundException extends RuntimeException {

    public CatalogNotFoundException(String resource) {
        super(resource + " not found");
    }
}

package com.anotame.catalog.infrastructure.web.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

// Only ever returned inside an untyped Response from the exception mapper, so the build cannot see
// it is serialised; a native image would otherwise drop its getters.
@RegisterForReflection
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorResponse {
    private String errorCode;
    private String message;
    private List<String> details;

    public ErrorResponse(String errorCode, String message) {
        this.errorCode = errorCode;
        this.message = message;
        this.details = List.of();
    }

}

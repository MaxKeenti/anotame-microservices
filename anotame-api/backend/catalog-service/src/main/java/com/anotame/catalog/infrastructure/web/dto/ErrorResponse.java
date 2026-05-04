package com.anotame.catalog.infrastructure.web.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

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

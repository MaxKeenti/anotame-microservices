package com.anotame.catalog.infrastructure.web.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorResponse {
    private String message;
    private List<String> details;

    public ErrorResponse(String message) {
        this.message = message;
        this.details = List.of();
    }
}

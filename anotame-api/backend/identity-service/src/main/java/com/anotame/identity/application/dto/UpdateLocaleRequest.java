package com.anotame.identity.application.dto;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateLocaleRequest {
    @Pattern(regexp = "^(es|en)$", message = "Locale must be 'es' or 'en'")
    private String locale;
}

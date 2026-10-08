package com.anotame.operations.application.dto;

import lombok.Builder;
import lombok.Data;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Data
@Builder
public class PublicReceiptSettingsResponse {
    private String name;
    @Schema(nullable = true)
    private String address;
    @Schema(nullable = true)
    private String rfc;
    @Schema(nullable = true)
    private String taxRegime;
    @Schema(nullable = true)
    private String contactPhone;
}

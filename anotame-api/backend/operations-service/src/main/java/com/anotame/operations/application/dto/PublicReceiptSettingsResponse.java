package com.anotame.operations.application.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PublicReceiptSettingsResponse {
    private String name;
    private String address;
    private String rfc;
    private String taxRegime;
    private String contactPhone;
}

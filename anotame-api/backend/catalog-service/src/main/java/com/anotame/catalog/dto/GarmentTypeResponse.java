package com.anotame.catalog.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class GarmentTypeResponse {
    private UUID id;
    private String code;
    private String name;
    private String description;
}

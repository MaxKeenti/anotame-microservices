package com.anotame.operations.domain.model;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class Establishment {
    private UUID id;
    private String name;
    private String ownerName;
    private String taxInfo; // JSON string or object
    private boolean isActive;
}

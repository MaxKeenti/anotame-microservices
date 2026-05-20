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
    private Integer dailyCapacityMinutes;
    private String primaryColor; // Hex format: "#FF6B6B", nullable
    private String fontFamily; // Font family name, nullable
    private Integer capacityThresholdGreen = 50;
    private Integer capacityThresholdAmber = 85;
    private Integer atRiskDaysThreshold = 60;
}

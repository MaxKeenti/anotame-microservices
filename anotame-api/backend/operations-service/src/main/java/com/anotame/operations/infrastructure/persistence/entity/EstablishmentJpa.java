package com.anotame.operations.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tce_establishment")
@Getter
@Setter
public class EstablishmentJpa {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_establishment")
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "owner_name")
    private String ownerName;

    @Column(name = "tax_info")
    @JdbcTypeCode(SqlTypes.JSON)
    private String taxInfo;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    @Column(name = "daily_capacity_minutes")
    private Integer dailyCapacityMinutes = 480; // Default 8 hours

    @Column(name = "primary_color", length = 7, nullable = true)
    private String primaryColor; // Hex format: "#FF6B6B", nullable

    @Column(name = "font_family", length = 32, nullable = true)
    private String fontFamily; // Enum values: "Inter", "Outfit", "Merriweather", nullable

    @Column(name = "capacity_threshold_green", columnDefinition = "INTEGER DEFAULT 50")
    private Integer capacityThresholdGreen = 50;

    @Column(name = "capacity_threshold_amber", columnDefinition = "INTEGER DEFAULT 85")
    private Integer capacityThresholdAmber = 85;

    @Column(name = "at_risk_days_threshold", columnDefinition = "INTEGER DEFAULT 60")
    private Integer atRiskDaysThreshold = 60;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

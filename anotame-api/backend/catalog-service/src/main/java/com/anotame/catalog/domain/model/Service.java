package com.anotame.catalog.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cci_service")
@Getter
@Setter
@SQLDelete(sql = "UPDATE cci_service SET is_deleted = true, deleted_at = NOW() WHERE id_service = ?")
@SQLRestriction("is_deleted = false")
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_service")
    private UUID id;

    @Column(unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "default_duration_min")
    private Integer defaultDurationMin = 30;

    @Column(name = "base_price", precision = 19, scale = 4)
    private BigDecimal basePrice = BigDecimal.ZERO;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_garment_type")
    private GarmentType garmentType;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "is_deleted", nullable = false) // Manually handled for now
    private boolean deleted = false;
}

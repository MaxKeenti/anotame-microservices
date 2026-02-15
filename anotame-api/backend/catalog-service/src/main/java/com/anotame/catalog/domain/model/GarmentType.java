package com.anotame.catalog.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cci_garment_type")
@Getter
@Setter
@SQLDelete(sql = "UPDATE cci_garment_type SET is_deleted = true, deleted_at = NOW() WHERE id_garment_type = ?")
@SQLRestriction("is_deleted = false")
public class GarmentType {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_garment_type")
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    // Manual Getters/Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    // Audit Fields
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "is_deleted", nullable = false) // Mapped to support usage, though usually handled by @SQLDelete
    private boolean deleted = false;
}
